import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
 
export default function PrivateRoute() {
  const { user, loading } = useAuth()
  // If still validating but we have a cached user, allow rendering so navbar is visible immediately.
  if (loading && !user) return (
    <div className="flex items-center justify-center h-screen bg-slate-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
    </div>
  )
  return user ? <Outlet /> : <Navigate to="/login" replace />
}