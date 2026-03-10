# Multi-person Ordering Feature Plan

## New Files

1. `**src/lib/weekUtils.ts**` — Week calculation utilities
  - `getCurrentWeekStart()` → Monday date string (e.g. "2026-03-09")
  - `getWeekRange()` → `{ start, end }` for display ("3/9 - 3/15")
  - Auto-detects new week on Monday
2. `**src/hooks/useWeeklyOrders.ts**` — Order management hook (localStorage + Supabase-ready)
  - Data model per week:
  - Methods: `submitOrder(userId, userName, dishIds)`, `confirmDish(dishId)`, `removeDish(dishId)`, `getMyOrder(userId)`
  - Includes simulated family orders for demo ("妈妈", "爸爸", "弟弟")
  - New week → fresh data automatically

## Rewritten Files

1. `**src/pages/OrderPage.tsx**` — Full rewrite matching prototype
  - Header: "选择本周想吃的菜" + week range + user badge
  - Category filter pills (全部/家常菜/荤菜/素菜/汤/凉菜)
  - Dish list from `useDishes` with checkbox cards
  - Each card: checkbox + name + category tag + ingredient preview
  - Selected: orange border + orange-50 bg
  - Fixed bottom submit bar with count + "提交点菜" button
  - After submit: success toast
2. `**src/pages/SummaryPage.tsx**` — Chef view matching prototype
  - Header: "本周点菜汇总" + voter count
  - Sorted by popularity (most voters first)
  - Each card: fire icons (🔥 per voter) + dish name + category tag
  - Voter badges below dish name
  - Three states per dish:
    - Default: "确认" button (green)
    - Confirmed: "已做" button (blue) + green bg
    - Done: strikethrough + "已完成" label
  - "查看购物清单" CTA when confirmed dishes exist

## Shared State

- No context needed — both pages use same localStorage key
- React Router unmounts/remounts on tab switch, so hooks always read fresh data
- Current user stored in `localStorage('mealpick_user')`, default "Adrian"

