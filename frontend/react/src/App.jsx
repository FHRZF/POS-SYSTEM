// ============================================================
// src/App.jsx - Main App with routing
// ============================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './components/PrivateRoute'
import RoleRoute from './components/RoleRoute'
import MainLayout from './layouts/MainLayout'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Branches from './pages/Branches'
import Products from './pages/Products'
import Categories from './pages/Categories'
import POS from './pages/POS'
import SalesHistory from './pages/SalesHistory'
import Purchases from './pages/Purchases'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Stocks from './pages/Stocks'
import Suppliers from './pages/Suppliers'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/sales" element={<SalesHistory />} />
            <Route element={<RoleRoute roles={['owner', 'admin']} />}>
              <Route path="/branches" element={<Branches />} />
              <Route path="/products" element={<Products />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/stocks" element={<Stocks />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/reports" element={<Reports />} />
            </Route>
            <Route element={<RoleRoute roles={['owner', 'admin']} />}>
              <Route path="/users" element={<Users />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}