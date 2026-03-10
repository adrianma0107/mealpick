import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { UserProvider, useUser } from './contexts/UserContext'
import { WeekProvider } from './contexts/WeekContext'
import BottomNav from './components/BottomNav'
import OrderPage from './pages/OrderPage'
import SummaryPage from './pages/SummaryPage'
import ShoppingPage from './pages/ShoppingPage'
import CalendarPage from './pages/CalendarPage'
import DishLibraryPage from './pages/DishLibraryPage'
import WelcomePage from './pages/WelcomePage'
import JoinPage from './pages/JoinPage'

function MainApp() {
  const { loading, registered, familyId } = useUser()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full max-w-md mx-auto bg-gray-50">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!registered || !familyId) {
    return <WelcomePage />
  }

  return (
    <WeekProvider>
      <div className="flex flex-col h-full max-w-md mx-auto bg-gray-50">
        <main className="flex-1 overflow-hidden flex flex-col">
          <Routes>
            <Route path="/" element={<OrderPage />} />
            <Route path="/summary" element={<SummaryPage />} />
            <Route path="/shopping" element={<ShoppingPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/library" element={<DishLibraryPage />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </WeekProvider>
  )
}

function AppGate() {
  return (
    <Routes>
      <Route path="/join/:code" element={<JoinPage />} />
      <Route path="*" element={<MainApp />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <AppGate />
      </UserProvider>
    </BrowserRouter>
  )
}
