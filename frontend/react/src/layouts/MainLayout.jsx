// src/layouts/MainLayout.jsx
import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import {
  LayoutDashboard, ShoppingCart, History, Package, Tag,
  Truck, BarChart3, Users, Building2, Layers, LogOut,
  Menu, Bell, Sun, Moon, ChevronRight,
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/dashboard',  label: 'Dashboard',    icon: LayoutDashboard, roles: ['owner','admin','cashier'] },
  { path: '/pos',        label: 'POS Cashier',  icon: ShoppingCart,    roles: ['owner','admin','cashier'], highlight: true },
  { path: '/sales',      label: 'Sales History',icon: History,         roles: ['owner','admin','cashier'] },
  { divider: true,       label: 'Management',                          roles: ['owner','admin'] },
  { path: '/products',   label: 'Products',     icon: Package,         roles: ['owner','admin'] },
  { path: '/categories', label: 'Categories',   icon: Tag,             roles: ['owner','admin'] },
  { path: '/stocks',     label: 'Stock',        icon: Layers,          roles: ['owner','admin'] },
  { path: '/purchases',  label: 'Purchases',    icon: Truck,           roles: ['owner','admin'] },
  { path: '/suppliers',  label: 'Suppliers',    icon: Building2,       roles: ['owner','admin'] },
  { path: '/branches',   label: 'Branches',     icon: Building2,       roles: ['owner','admin'] },
  { divider: true,       label: 'Analytics',                           roles: ['owner','admin'] },
  { path: '/reports',    label: 'Reports',      icon: BarChart3,       roles: ['owner','admin'] },
  { path: '/users',      label: 'Users',        icon: Users,           roles: ['owner','admin'] },
]

export default function MainLayout() {
  const { user, logout, hasAnyRole, loading } = useAuth()
  const { dark, toggle } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
    </div>
  )

  const handleLogout = async () => { await logout(); navigate('/login') }

  const visibleItems = NAV_ITEMS.filter(item => {
    // Divider items always visible for their intended roles
    if (item.divider) return hasAnyRole && hasAnyRole(item.roles)
    // Regular nav items 
    return hasAnyRole && hasAnyRole(item.roles ?? ['owner','admin','cashier'])
  })

  const SidebarContent = () => (
    <div className={`h-screen flex flex-col overflow-hidden transition-all duration-300 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50 ${collapsed ? 'w-[70px]' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100 dark:border-slate-700/50 flex-shrink-0">
        <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/30">
          <ShoppingCart size={17} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-slate-900 dark:text-white font-bold text-sm leading-tight whitespace-nowrap">POS System</div>
            <div className="text-slate-400 text-xs whitespace-nowrap truncate">{user?.branch?.name || 'All Branches'}</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleItems.map((item, i) => {
          if (item.divider) {
            if (collapsed) return <div key={i} className="my-2 border-t border-slate-100 dark:border-slate-700/50" />
            return (
              <div key={i} className="px-3 pt-4 pb-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{item.label}</span>
              </div>
            )
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${item.highlight && !isActive
                  ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-sm shadow-emerald-500/30'
                  : isActive
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }
              `}
            >
              <item.icon size={17} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-700/50 flex-shrink-0">
        {collapsed ? (
          <button onClick={handleLogout} className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Logout">
            <LogOut size={17} />
          </button>
        ) : (
          <div className="flex items-center gap-2 px-2 py-2 rounded-xl">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-slate-900 dark:text-white text-sm font-medium truncate">{user?.name}</div>
              <div className="text-slate-400 text-xs capitalize">{user?.role?.display_name}</div>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg" title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
    
  )

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0"><SidebarContent /></div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <SidebarContent />
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/50 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Menu size={18} />
          </button>
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronRight size={18} className={`transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
          </button>

          <div className="flex-1" />

          <button className="relative text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          </button>

          {/* Theme toggle */}
          <button onClick={toggle} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title={dark ? 'Light mode' : 'Dark mode'}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-slate-700 dark:text-slate-300 text-sm hidden sm:block">{user?.name}</span>
            <span className="hidden sm:block text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full capitalize">{user?.role?.display_name}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6"><Outlet /></div>
        </main>
      </div>
    </div>
  )
}