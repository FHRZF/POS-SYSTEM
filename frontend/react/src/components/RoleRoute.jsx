import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
 
export default function RoleRoute({ roles }) {
  const { user, hasAnyRole } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!hasAnyRole(roles)) return <Navigate to="/dashboard" replace />
  return <Outlet />
}