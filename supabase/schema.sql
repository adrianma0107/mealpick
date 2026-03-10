-- ============================================================
-- MealPick — Supabase Schema
-- ============================================================
-- 执行顺序：Extensions → Tables → Indexes → RLS → Policies → Triggers
-- ============================================================


-- ============================================================
-- 0. Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- 1. Tables
-- ============================================================

-- 1.1 families（家庭组）
CREATE TABLE IF NOT EXISTS public.families (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text        NOT NULL,
  -- 8 位随机邀请码，JOIN 时使用
  invite_code text        UNIQUE NOT NULL
                          DEFAULT upper(substr(md5(random()::text), 1, 8)),
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.families              IS '家庭组';
COMMENT ON COLUMN public.families.invite_code  IS '邀请码，其他成员凭此加入家庭';

-- ─────────────────────────────────────────────────────────────

-- 1.2 users（用户档案，对应 auth.users 1:1）
CREATE TABLE IF NOT EXISTS public.users (
  id          uuid        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  name        text        NOT NULL,
  family_id   uuid        REFERENCES public.families (id) ON DELETE SET NULL,
  role        text        NOT NULL DEFAULT 'member'
                          CHECK (role IN ('admin', 'member')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.users           IS '用户档案（与 auth.users 1:1）';
COMMENT ON COLUMN public.users.role      IS 'admin=家庭管理员, member=普通成员';
COMMENT ON COLUMN public.users.family_id IS 'NULL 表示尚未加入任何家庭';

-- ─────────────────────────────────────────────────────────────

-- 1.3 dishes（菜品）
CREATE TABLE IF NOT EXISTS public.dishes (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text        NOT NULL,
  category    text,                        -- 例：肉类、蔬菜、海鲜、汤类、主食
  family_id   uuid        NOT NULL REFERENCES public.families (id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.dishes IS '菜品库，每道菜归属于一个家庭';

-- ─────────────────────────────────────────────────────────────

-- 1.4 ingredients（食材明细）
CREATE TABLE IF NOT EXISTS public.ingredients (
  id      uuid    PRIMARY KEY DEFAULT uuid_generate_v4(),
  dish_id uuid    NOT NULL REFERENCES public.dishes (id) ON DELETE CASCADE,
  name    text    NOT NULL,
  qty     numeric,           -- 数量（NULL 表示适量）
  unit    text               -- 单位：g / ml / 个 / 根 …
);

COMMENT ON TABLE public.ingredients IS '菜品的食材明细';

-- ─────────────────────────────────────────────────────────────

-- 1.5 weekly_orders（周点菜记录）
CREATE TABLE IF NOT EXISTS public.weekly_orders (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id   uuid        NOT NULL REFERENCES public.families (id) ON DELETE CASCADE,
  week_start  date        NOT NULL,  -- 每周一的日期，作为周标识
  user_id     uuid        NOT NULL REFERENCES public.users (id)   ON DELETE CASCADE,
  dish_id     uuid        NOT NULL REFERENCES public.dishes (id)  ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.weekly_orders            IS '每周点菜记录';
COMMENT ON COLUMN public.weekly_orders.week_start IS '该周周一日期（YYYY-MM-DD）';

-- ─────────────────────────────────────────────────────────────

-- 1.6 calendar_entries（日历餐食记录）
CREATE TABLE IF NOT EXISTS public.calendar_entries (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id   uuid        NOT NULL REFERENCES public.families (id) ON DELETE CASCADE,
  date        date        NOT NULL,
  meal_type   text        NOT NULL DEFAULT 'dinner'
                          CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  dish_id     uuid        NOT NULL REFERENCES public.dishes (id)  ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  -- 同一家庭、同一天、同一餐次、同一菜品不重复
  UNIQUE (family_id, date, meal_type, dish_id)
);

COMMENT ON TABLE  public.calendar_entries          IS '日历维度的餐食安排';
COMMENT ON COLUMN public.calendar_entries.meal_type IS 'breakfast/lunch/dinner';


-- ============================================================
-- 2. Indexes
-- ============================================================

-- users
CREATE INDEX IF NOT EXISTS idx_users_family_id
  ON public.users (family_id);

-- dishes
CREATE INDEX IF NOT EXISTS idx_dishes_family_id
  ON public.dishes (family_id);

CREATE INDEX IF NOT EXISTS idx_dishes_category
  ON public.dishes (family_id, category);

-- ingredients
CREATE INDEX IF NOT EXISTS idx_ingredients_dish_id
  ON public.ingredients (dish_id);

-- weekly_orders
CREATE INDEX IF NOT EXISTS idx_weekly_orders_family_week
  ON public.weekly_orders (family_id, week_start);

CREATE INDEX IF NOT EXISTS idx_weekly_orders_user
  ON public.weekly_orders (user_id);

-- calendar_entries
CREATE INDEX IF NOT EXISTS idx_calendar_entries_family_date
  ON public.calendar_entries (family_id, date);


-- ============================================================
-- 3. Helper Function
-- 用 SECURITY DEFINER 绕开 users 表自身的 RLS，安全获取当前用户的 family_id
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_family_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_id
  FROM   public.users
  WHERE  id = auth.uid()
  LIMIT  1;
$$;

COMMENT ON FUNCTION public.get_my_family_id IS
  '返回当前认证用户所属的 family_id，RLS 策略中使用';


-- ============================================================
-- 4. Row Level Security — Enable
-- ============================================================

ALTER TABLE public.families        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_entries ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 5. RLS Policies
-- ============================================================

-- ────────────────────────────────────────
-- 5.1 families
-- ────────────────────────────────────────

-- 读：只能看到自己所在的家庭
CREATE POLICY "families: members can read own family"
  ON public.families FOR SELECT
  USING (id = public.get_my_family_id());

-- 写：任何已登录用户可以创建家庭（注册流程第一步）
CREATE POLICY "families: authenticated users can create"
  ON public.families FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 改：仅家庭 admin 可修改
CREATE POLICY "families: admin can update"
  ON public.families FOR UPDATE
  USING (
    id = public.get_my_family_id()
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 删：仅家庭 admin 可删除
CREATE POLICY "families: admin can delete"
  ON public.families FOR DELETE
  USING (
    id = public.get_my_family_id()
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ────────────────────────────────────────
-- 5.2 users
-- ────────────────────────────────────────

-- 读：同家庭成员互相可见；未加入家庭的用户只能看到自己
CREATE POLICY "users: read same family or self"
  ON public.users FOR SELECT
  USING (
    id = auth.uid()
    OR family_id = public.get_my_family_id()
  );

-- 写：新用户注册时插入自己的档案（id 必须匹配 auth.uid）
CREATE POLICY "users: insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

-- 改：用户可更新自己的档案；admin 可更新同家庭成员
CREATE POLICY "users: update self or admin manages family"
  ON public.users FOR UPDATE
  USING (
    id = auth.uid()
    OR (
      family_id = public.get_my_family_id()
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- 删：admin 可移除同家庭成员（不可删除自己）
CREATE POLICY "users: admin can remove members"
  ON public.users FOR DELETE
  USING (
    family_id = public.get_my_family_id()
    AND id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ────────────────────────────────────────
-- 5.3 dishes
-- ────────────────────────────────────────

-- 同家庭成员对菜品有完整读写权限
CREATE POLICY "dishes: family members full access"
  ON public.dishes FOR ALL
  USING  (family_id = public.get_my_family_id())
  WITH CHECK (family_id = public.get_my_family_id());

-- ────────────────────────────────────────
-- 5.4 ingredients
-- 通过 dish_id → dishes.family_id 确认归属
-- ────────────────────────────────────────

CREATE POLICY "ingredients: family members full access"
  ON public.ingredients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.dishes
      WHERE id        = ingredients.dish_id
        AND family_id = public.get_my_family_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dishes
      WHERE id        = ingredients.dish_id
        AND family_id = public.get_my_family_id()
    )
  );

-- ────────────────────────────────────────
-- 5.5 weekly_orders
-- ────────────────────────────────────────

CREATE POLICY "weekly_orders: family members full access"
  ON public.weekly_orders FOR ALL
  USING  (family_id = public.get_my_family_id())
  WITH CHECK (family_id = public.get_my_family_id());

-- ────────────────────────────────────────
-- 5.6 calendar_entries
-- ────────────────────────────────────────

CREATE POLICY "calendar_entries: family members full access"
  ON public.calendar_entries FOR ALL
  USING  (family_id = public.get_my_family_id())
  WITH CHECK (family_id = public.get_my_family_id());


-- ============================================================
-- 6. Trigger — 自动创建用户档案
-- 新用户在 auth.users 注册后，自动在 public.users 插入初始档案
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      '新用户'
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS
  '用户注册后自动创建 public.users 档案，name 取 meta.name 或邮箱前缀';


-- ============================================================
-- 7. Convenience View — 当前用户的家庭菜品（含食材）
-- ============================================================

CREATE OR REPLACE VIEW public.v_family_dishes AS
SELECT
  d.id          AS dish_id,
  d.name        AS dish_name,
  d.category,
  d.family_id,
  d.created_at  AS dish_created_at,
  json_agg(
    json_build_object(
      'id',   i.id,
      'name', i.name,
      'qty',  i.qty,
      'unit', i.unit
    ) ORDER BY i.name
  ) FILTER (WHERE i.id IS NOT NULL) AS ingredients
FROM public.dishes d
LEFT JOIN public.ingredients i ON i.dish_id = d.id
GROUP BY d.id, d.name, d.category, d.family_id, d.created_at;

COMMENT ON VIEW public.v_family_dishes IS
  '当前家庭的菜品列表（已含嵌套食材），受 dishes RLS 控制';
