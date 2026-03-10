import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/',          label: '点菜',   icon: '🍜' },
  { to: '/summary',  label: '汇总',   icon: '📊' },
  { to: '/shopping', label: '购物',   icon: '🛒' },
  { to: '/calendar', label: '日历',   icon: '📅' },
  { to: '/library',  label: '菜品库', icon: '📖' },
]

export default function BottomNav() {
  return (
    <nav className="flex-shrink-0 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                isActive ? 'text-orange-500' : 'text-gray-400'
              }`
            }
          >
            <span className="text-xl">{icon}</span>
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
