-- ============================================================
-- MealPick — Migration: Device-UUID Auth (修正版)
-- ============================================================
-- 必须先删除所有依赖 users.id 的策略和函数，才能改列类型
-- ============================================================

-- ====== 第一步：删除所有 RLS 策略 ======

-- families
DROP POLICY IF EXISTS "families: members can read own family" ON public.families;
DROP POLICY IF EXISTS "families: authenticated users can create" ON public.families;
DROP POLICY IF EXISTS "families: admin can update" ON public.families;
DROP POLICY IF EXISTS "families: admin can delete" ON public.families;

-- users
DROP POLICY IF EXISTS "users: read same family or self" ON public.users;
DROP POLICY IF EXISTS "users: insert own profile" ON public.users;
DROP POLICY IF EXISTS "users: update self or admin manages family" ON public.users;
DROP POLICY IF EXISTS "users: admin can remove members" ON public.users;

-- dishes
DROP POLICY IF EXISTS "dishes: family members full access" ON public.dishes;

-- ingredients
DROP POLICY IF EXISTS "ingredients: family members full access" ON public.ingredients;

-- weekly_orders
DROP POLICY IF EXISTS "weekly_orders: family members full access" ON public.weekly_orders;

-- calendar_entries
DROP POLICY IF EXISTS "calendar_entries: family members full access" ON public.calendar_entries;

-- ====== 第二步：删除依赖 users.id 的函数和触发器 ======

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_my_family_id();

-- ====== 第三步：删除外键约束，改列类型 ======

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_pkey CASCADE;
ALTER TABLE public.users ALTER COLUMN id TYPE text;
ALTER TABLE public.users ADD PRIMARY KEY (id);

ALTER TABLE public.weekly_orders ALTER COLUMN user_id TYPE text;

-- ====== 第四步：创建新的 anon-friendly RLS 策略 ======

-- families
CREATE POLICY "families: anon full access"
  ON public.families FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- users
CREATE POLICY "users: anon full access"
  ON public.users FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- dishes
CREATE POLICY "dishes: anon full access"
  ON public.dishes FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ingredients
CREATE POLICY "ingredients: anon full access"
  ON public.ingredients FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- weekly_orders
CREATE POLICY "weekly_orders: anon full access"
  ON public.weekly_orders FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- calendar_entries
CREATE POLICY "calendar_entries: anon full access"
  ON public.calendar_entries FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
