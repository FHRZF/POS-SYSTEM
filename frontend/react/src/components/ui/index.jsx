// src/components/ui/index.jsx
// Semua shared UI components dengan dark/light theme support

import { X, Loader2 } from 'lucide-react'

// ─── Page Header ────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  )
}

// ─── Data Table ─────────────────────────────────────────────
export function DataTable({ columns, data, loading, emptyMessage = 'No data found' }) {
  if (loading) return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-12 flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-emerald-500" />
    </div>
  )

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
              {columns.map((col, i) => (
                <th key={i} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3.5">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {(!data || data.length === 0) && (
              <tr>
                <td colSpan={columns.length} className="text-center py-14 text-slate-400 dark:text-slate-500 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {data?.map((row, i) => (
              <tr key={row.id ?? i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                {columns.map((col, j) => (
                  <td key={j} className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Modal ───────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full ${sizes[size]} shadow-2xl max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <h3 className="text-slate-900 dark:text-white font-semibold text-base">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

// ─── Form Field ──────────────────────────────────────────────
export function FormField({ label, required, error, hint, children }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-slate-400 text-xs mt-1">{hint}</p>}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

// ─── Input ───────────────────────────────────────────────────
export function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all ${className}`}
    />
  )
}

// ─── Textarea ────────────────────────────────────────────────
export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      {...props}
      className={`w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none ${className}`}
    />
  )
}

// ─── Select ──────────────────────────────────────────────────
export function Select({ children, className = '', ...props }) {
  return (
    <select
      {...props}
      className={`w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all ${className}`}
    >
      {children}
    </select>
  )
}

// ─── Button ──────────────────────────────────────────────────
export function Btn({ children, variant = 'primary', size = 'md', loading = false, className = '', ...props }) {
  const variants = {
    primary:   'bg-emerald-500 hover:bg-emerald-400 text-white shadow-sm shadow-emerald-500/25',
    secondary: 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    danger:    'bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/20',
    ghost:     'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400',
  }
  const sizes = {
    xs: 'px-2.5 py-1 text-xs',
    sm: 'px-3.5 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  )
}

// ─── Badge ───────────────────────────────────────────────────
export function Badge({ children, color = 'slate' }) {
  const colors = {
    emerald: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
    blue:    'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
    red:     'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30',
    amber:   'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
    slate:   'bg-slate-100 dark:bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/30',
    purple:  'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  )
}

// ─── Toast ───────────────────────────────────────────────────
export function Toast({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 z-[200] space-y-2 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className={`
          flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium pointer-events-auto
          transition-all duration-300 animate-[slideUp_0.3s_ease-out]
          ${toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : ''}
          ${toast.type === 'error'   ? 'bg-red-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400' : ''}
          ${toast.type === 'info'    ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400' : ''}
          ${toast.type === 'warning' ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400' : ''}
        `}>
          {toast.message}
        </div>
      ))}
    </div>
  )
}

// ─── Pagination ──────────────────────────────────────────────
export function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null
  const pages = Array.from({ length: meta.last_page }, (_, i) => i + 1)
  const visible = pages.filter(p => p === 1 || p === meta.last_page || Math.abs(p - meta.current_page) <= 2)

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Showing {meta.from}–{meta.to} of {meta.total} results
      </p>
      <div className="flex items-center gap-1">
        <Btn variant="secondary" size="sm" onClick={() => onPageChange(meta.current_page - 1)} disabled={meta.current_page === 1}>
          ‹ Prev
        </Btn>
        {visible.map((p, i, arr) => (
          <>
            {i > 0 && arr[i - 1] !== p - 1 && <span key={`dot-${p}`} className="text-slate-400 px-1">…</span>}
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                p === meta.current_page
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {p}
            </button>
          </>
        ))}
        <Btn variant="secondary" size="sm" onClick={() => onPageChange(meta.current_page + 1)} disabled={meta.current_page === meta.last_page}>
          Next ›
        </Btn>
      </div>
    </div>
  )
}

// ─── Search Input ────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <Input value={value} onChange={onChange} placeholder={placeholder} className="pl-9" />
    </div>
  )
}

// ─── Confirm Dialog ──────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger', loading = false }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <h3 className="text-slate-900 dark:text-white font-semibold mb-2">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">{message}</p>
        <div className="flex gap-3">
          <Btn onClick={onConfirm} variant={variant} loading={loading} className="flex-1 justify-center">{confirmLabel}</Btn>
          <Btn onClick={onClose} variant="secondary" className="flex-1 justify-center">Cancel</Btn>
        </div>
      </div>
    </div>
  )
}

// ─── Stats Card ──────────────────────────────────────────────
export function StatsCard({ title, value, icon: Icon, color = 'emerald', subtitle, trend }) {
  const colors = {
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', icon: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-500/20' },
    blue:    { bg: 'bg-blue-50 dark:bg-blue-500/10',       border: 'border-blue-200 dark:border-blue-500/20',       icon: 'text-blue-600 dark:text-blue-400',       iconBg: 'bg-blue-100 dark:bg-blue-500/20' },
    purple:  { bg: 'bg-purple-50 dark:bg-purple-500/10',   border: 'border-purple-200 dark:border-purple-500/20',   icon: 'text-purple-600 dark:text-purple-400',   iconBg: 'bg-purple-100 dark:bg-purple-500/20' },
    amber:   { bg: 'bg-amber-50 dark:bg-amber-500/10',     border: 'border-amber-200 dark:border-amber-500/20',     icon: 'text-amber-600 dark:text-amber-400',     iconBg: 'bg-amber-100 dark:bg-amber-500/20' },
    red:     { bg: 'bg-red-50 dark:bg-red-500/10',         border: 'border-red-200 dark:border-red-500/20',         icon: 'text-red-600 dark:text-red-400',         iconBg: 'bg-red-100 dark:bg-red-500/20' },
  }
  const c = colors[color]
  return (
    <div className={`${c.bg} ${c.border} border rounded-2xl p-5`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center`}>
          <Icon size={20} className={c.icon} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white mb-0.5">{value}</div>
      <div className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</div>
      {subtitle && <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</div>}
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon size={48} className="text-slate-300 dark:text-slate-600 mb-4" />}
      <h3 className="text-slate-700 dark:text-slate-300 font-medium mb-1">{title}</h3>
      {message && <p className="text-slate-400 dark:text-slate-500 text-sm max-w-xs">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── Card ────────────────────────────────────────────────────
export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl ${className}`}>
      {children}
    </div>
  )
}