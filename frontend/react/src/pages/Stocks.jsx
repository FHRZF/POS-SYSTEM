// src/pages/Stocks.jsx
import { useState, useEffect, useCallback } from 'react'
import { Layers, AlertTriangle, Plus, Minus, Settings2, Filter } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/useToast'
import {
  PageHeader, DataTable, Modal, FormField,
  Input, Select, Btn, Badge, SearchInput, Toast, Card, StatsCard
} from '../components/ui'
import { formatNumber } from '../utils/formatters'

export default function Stocks() {
  const { user } = useAuth()
  const [stocks, setStocks]       = useState([])
  const [branches, setBranches]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [branchFilter, setBranchFilter] = useState(user?.branch_id || '')
  const [lowOnly, setLowOnly]     = useState(false)
  const [showAdjust, setShowAdjust] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState(null)
  const [adjustForm, setAdjustForm] = useState({ quantity: '', type: 'add', reason: '' })
  const [saving, setSaving]       = useState(false)
  const { toasts, success, error }= useToast()

  const load = useCallback(() => {
    setLoading(true)
    api.get('/stocks', { params: { branch_id: branchFilter, low_stock: lowOnly || undefined } })
      .then(r => setStocks(r.data.data || []))
      .finally(() => setLoading(false))
  }, [branchFilter, lowOnly])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (user?.hasAnyRole?.(['owner'])) {
      api.get('/branches').then(r => setBranches(r.data.data || []))
    }
  }, [user])

  const filtered = stocks.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.variant?.variant_name?.toLowerCase().includes(q) ||
      s.variant?.product?.name?.toLowerCase().includes(q) ||
      s.variant?.sku?.toLowerCase().includes(q) ||
      s.variant?.barcode?.toLowerCase().includes(q)
    )
  })

  const lowStockCount = stocks.filter(s => s.quantity <= s.low_stock_threshold).length
  const outOfStock    = stocks.filter(s => s.quantity === 0).length
  const totalItems    = stocks.reduce((a, s) => a + s.quantity, 0)

  const openAdjust = (stock) => {
    setAdjustTarget(stock)
    setAdjustForm({ quantity: '', type: 'add', reason: '' })
    setShowAdjust(true)
  }

  const handleAdjust = async () => {
    if (!adjustForm.quantity || !adjustForm.reason) { error('Please fill all fields'); return }
    setSaving(true)
    try {
      await api.put(`/stocks/${adjustTarget.id}/adjust`, adjustForm)
      success('Stock adjusted successfully')
      setShowAdjust(false)
      load()
    } catch (err) {
      error(err.response?.data?.message || 'Failed to adjust')
    } finally { setSaving(false) }
  }

  const columns = [
    {
      header: 'Product',
      render: row => (
        <div>
          <div className="text-slate-900 dark:text-white font-medium text-sm">
            {row.variant?.product?.name}
          </div>
          <div className="text-slate-400 text-xs">{row.variant?.variant_name}</div>
          {row.variant?.sku && <div className="text-slate-300 dark:text-slate-600 text-xs font-mono">{row.variant.sku}</div>}
        </div>
      )
    },
    {
      header: 'Branch',
      render: row => (
        <span className="text-slate-600 dark:text-slate-400 text-sm">{row.branch?.name}</span>
      )
    },
    {
      header: 'Stock',
      render: row => {
        const isLow  = row.quantity <= row.low_stock_threshold && row.quantity > 0
        const isOut  = row.quantity === 0
        return (
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${isOut ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
              {formatNumber(row.quantity)}
            </span>
            {isOut  && <Badge color="red"><AlertTriangle size={10}/> Out of Stock</Badge>}
            {isLow  && <Badge color="amber"><AlertTriangle size={10}/> Low Stock</Badge>}
          </div>
        )
      }
    },
    {
      header: 'Min. Threshold',
      render: row => (
        <span className="text-slate-500 dark:text-slate-400 text-sm">{formatNumber(row.low_stock_threshold)} units</span>
      )
    },
    {
      header: 'Actions',
      render: row => (
        <Btn variant="secondary" size="sm" onClick={() => openAdjust(row)}>
          <Settings2 size={13}/> Adjust
        </Btn>
      )
    }
  ]

  return (
    <div>
      <Toast toasts={toasts} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Total Stock Items"  value={formatNumber(totalItems)}   icon={Layers}        color="blue"  />
        <StatsCard title="Low Stock Alerts"   value={lowStockCount}              icon={AlertTriangle} color="amber" />
        <StatsCard title="Out of Stock"       value={outOfStock}                 icon={AlertTriangle} color="red"   />
      </div>

      <PageHeader title="Stock Management" subtitle="Monitor and adjust inventory levels" />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product, SKU, barcode..." className="max-w-xs flex-1 sm:flex-none" />

        {branches.length > 0 && (
          <Select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="w-auto">
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        )}

        <button
          onClick={() => setLowOnly(!lowOnly)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            lowOnly
              ? 'bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <Filter size={14}/>
          Low Stock Only
          {lowStockCount > 0 && (
            <span className="bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {lowStockCount}
            </span>
          )}
        </button>
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No stock records found" />

      {/* Adjust Modal */}
      <Modal open={showAdjust} onClose={() => setShowAdjust(false)} title="Adjust Stock" size="sm">
        {adjustTarget && (
          <div className="space-y-4">
            {/* Product info */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
              <div className="text-slate-900 dark:text-white font-semibold text-sm">{adjustTarget.variant?.product?.name}</div>
              <div className="text-slate-400 text-xs">{adjustTarget.variant?.variant_name} · {adjustTarget.branch?.name}</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 text-sm">Current stock:</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{formatNumber(adjustTarget.quantity)}</span>
              </div>
            </div>

            <FormField label="Adjustment Type">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'add',      label: '+ Add',  icon: Plus  },
                  { id: 'subtract', label: '- Subtract', icon: Minus },
                  { id: 'set',      label: '= Set',  icon: Settings2 },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setAdjustForm(f => ({ ...f, type: t.id }))}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-sm font-medium transition-all ${
                      adjustForm.type === t.id
                        ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-400'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <t.icon size={13}/> {t.label}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Quantity" required>
              <Input
                type="number"
                min="0"
                value={adjustForm.quantity}
                onChange={e => setAdjustForm(f => ({ ...f, quantity: e.target.value }))}
                placeholder="Enter quantity"
                autoFocus
              />
            </FormField>

            <FormField label="Reason" required>
              <Input
                value={adjustForm.reason}
                onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="e.g. Manual count, Damage, Return..."
              />
            </FormField>

            <div className="flex gap-3">
              <Btn onClick={handleAdjust} loading={saving} className="flex-1 justify-center">Adjust Stock</Btn>
              <Btn variant="secondary" onClick={() => setShowAdjust(false)}>Cancel</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}