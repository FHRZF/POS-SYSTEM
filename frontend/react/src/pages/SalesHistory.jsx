// src/pages/SalesHistory.jsx
import { useState, useEffect, useCallback } from 'react'
import { Eye, XCircle, History, TrendingUp, Receipt } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/useToast'
import {
  PageHeader, DataTable, Modal, Btn, Badge,
  SearchInput, Select, Toast, StatsCard, ConfirmDialog
} from '../components/ui'
import { formatCurrency, formatDateTime } from '../utils/formatters'

const STATUS_COLOR = { completed:'emerald', pending:'amber', cancelled:'red', refunded:'purple' }

export default function SalesHistory() {
  const { user } = useAuth()
  const [sales, setSales]         = useState([])
  const [meta, setMeta]           = useState(null)
  const [branches, setBranches]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [detail, setDetail]       = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const { toasts, success, error }= useToast()

  const [filters, setFilters] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date:   new Date().toISOString().split('T')[0],
    branch_id: user?.branch_id || '',
    status: '',
    page: 1,
  })

  const load = useCallback(() => {
    setLoading(true)
    api.get('/sales', { params: { ...filters, per_page: 20 } })
      .then(r => { setSales(r.data.data || []); setMeta(r.data.meta) })
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (user?.hasAnyRole?.(['owner', 'admin'])) {
      api.get('/branches').then(r => setBranches(r.data.data || []))
    }
  }, [user])

  const openDetail = async (sale) => {
    setLoadingDetail(true)
    setDetail({})
    try {
      const r = await api.get(`/sales/${sale.id}`)
      setDetail(r.data.data)
    } finally { setLoadingDetail(false) }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await api.put(`/sales/${cancelTarget.id}/cancel`)
      success('Sale cancelled and stock restored')
      setShowCancel(false)
      load()
    } catch (err) {
      error(err.response?.data?.message || 'Cannot cancel this sale')
    } finally { setCancelling(false) }
  }

  const totalRevenue = sales.filter(s => s.status === 'completed').reduce((a, s) => a + parseFloat(s.total_amount), 0)
  const totalCount   = sales.filter(s => s.status === 'completed').length

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }))

  const columns = [
    {
      header: 'Sale #',
      render: row => (
        <div>
          <div className="text-slate-900 dark:text-white font-semibold text-sm font-mono">{row.sale_number}</div>
          <div className="text-slate-400 text-xs">{formatDateTime(row.sale_date)}</div>
        </div>
      )
    },
    {
      header: 'Cashier',
      render: row => <span className="text-slate-600 dark:text-slate-400 text-sm">{row.user?.name}</span>
    },
    {
      header: 'Branch',
      render: row => <span className="text-slate-600 dark:text-slate-400 text-sm">{row.branch?.name}</span>
    },
    {
      header: 'Items',
      render: row => (
        <span className="text-slate-600 dark:text-slate-400 text-sm">{row.items_count ?? 0} items</span>
      )
    },
    {
      header: 'Payment',
      render: row => (
        <Badge color={row.payment?.payment_method === 'cash' ? 'slate' : row.payment?.payment_method === 'qris' ? 'purple' : 'blue'}>
          {row.payment?.payment_method || '—'}
        </Badge>
      )
    },
    {
      header: 'Total',
      render: row => (
        <span className={`font-bold text-sm ${row.status === 'cancelled' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
          {formatCurrency(row.total_amount)}
        </span>
      )
    },
    {
      header: 'Status',
      render: row => <Badge color={STATUS_COLOR[row.status] || 'slate'}>{row.status}</Badge>
    },
    {
      header: 'Actions',
      render: row => (
        <div className="flex gap-2">
          <Btn variant="secondary" size="sm" onClick={() => openDetail(row)}><Eye size={13}/> View</Btn>
          {row.status === 'completed' && user?.hasAnyRole?.(['owner','admin']) && (
            <Btn variant="danger" size="sm" onClick={() => { setCancelTarget(row); setShowCancel(true) }}>
              <XCircle size={13}/>
            </Btn>
          )}
        </div>
      )
    }
  ]

  return (
    <div>
      <Toast toasts={toasts} />

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Period Revenue" value={formatCurrency(totalRevenue)} icon={TrendingUp} color="emerald" />
        <StatsCard title="Transactions"  value={totalCount}                   icon={Receipt}    color="blue"    />
        <StatsCard title="Avg. Order"    value={totalCount ? formatCurrency(totalRevenue / totalCount) : 'Rp 0'} icon={History} color="purple" />
      </div>

      <PageHeader title="Sales History" subtitle="View and manage all transactions" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 text-sm">From:</span>
          <input
            type="date"
            value={filters.start_date}
            onChange={e => setFilter('start_date', e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 text-sm">To:</span>
          <input
            type="date"
            value={filters.end_date}
            onChange={e => setFilter('end_date', e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        {branches.length > 0 && (
          <Select value={filters.branch_id} onChange={e => setFilter('branch_id', e.target.value)} className="w-auto">
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        )}
        <Select value={filters.status} onChange={e => setFilter('status', e.target.value)} className="w-auto">
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </Select>
      </div>

      {/* Mobile list */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="p-4 text-slate-600 dark:text-slate-400">Loading sales...</div>
        ) : sales.length === 0 ? (
          <div className="p-4 text-slate-600 dark:text-slate-400">No sales in this period</div>
        ) : (
          sales.map(s => (
            <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-sm text-slate-700 dark:text-slate-300">{s.sale_number}</div>
                    <div className="text-xs text-slate-400">{formatDateTime(s.sale_date)}</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{s.user?.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{s.items_count ?? 0} items • {s.branch?.name || ''}</div>
                  <div className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(s.total_amount)}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge color={STATUS_COLOR[s.status] || 'slate'}>{s.status}</Badge>
                  <div className="flex items-center gap-2">
                    <Btn type="button" variant="secondary" size="sm" onClick={() => openDetail(s)} aria-label={`View ${s.sale_number}`}><Eye size={13}/> View</Btn>
                    {s.status === 'completed' && user?.hasAnyRole?.(['owner','admin']) && (
                      <Btn type="button" variant="danger" size="sm" onClick={() => { setCancelTarget(s); setShowCancel(true) }} aria-label={`Cancel ${s.sale_number}`}><XCircle size={13}/></Btn>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block">
        <DataTable columns={columns} data={sales} loading={loading} emptyMessage="No sales in this period" />
      </div>

      {/* Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.sale_number ? `Sale: ${detail.sale_number}` : 'Loading...'} size="lg">
        {loadingDetail ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : detail?.id ? (
          <div className="space-y-4">
            {/* Info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ['Date', formatDateTime(detail.sale_date)],
                ['Cashier', detail.user?.name],
                ['Branch', detail.branch?.name],
                ['Payment', detail.payment?.payment_method],
                ['Status', detail.status],
                ['Paid', formatCurrency(detail.payment?.amount)],
              ].map(([l, v]) => (
                <div key={l} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                  <div className="text-slate-400 text-xs mb-0.5">{l}</div>
                  <div className="text-slate-900 dark:text-white font-medium capitalize text-sm">{v}</div>
                </div>
              ))}
            </div>

            {/* Items */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left text-slate-500 dark:text-slate-400 font-medium pb-2">Product</th>
                  <th className="text-right text-slate-500 dark:text-slate-400 font-medium pb-2">Qty</th>
                  <th className="text-right text-slate-500 dark:text-slate-400 font-medium pb-2">Price</th>
                  <th className="text-right text-slate-500 dark:text-slate-400 font-medium pb-2">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {detail.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2.5 text-slate-900 dark:text-white">
                      {item.variant?.product?.name} — {item.variant?.variant_name}
                    </td>
                    <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">{item.quantity}</td>
                    <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">{formatCurrency(item.unit_price)}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-900 dark:text-white">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {detail.discount_amount > 0 && (
                  <tr><td colSpan={3} className="pt-2 text-right text-slate-500">Discount</td>
                    <td className="pt-2 text-right text-red-500">-{formatCurrency(detail.discount_amount)}</td></tr>
                )}
                <tr className="border-t-2 border-slate-200 dark:border-slate-700">
                  <td colSpan={3} className="pt-3 text-right font-bold text-slate-900 dark:text-white">Total</td>
                  <td className="pt-3 text-right font-bold text-emerald-600 dark:text-emerald-400 text-base">{formatCurrency(detail.total_amount)}</td>
                </tr>
                {detail.payment?.change_amount > 0 && (
                  <tr><td colSpan={3} className="pt-1 text-right text-slate-500 text-sm">Change</td>
                    <td className="pt-1 text-right text-slate-600 dark:text-slate-400 text-sm">{formatCurrency(detail.payment.change_amount)}</td></tr>
                )}
              </tfoot>
            </table>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={handleCancel}
        title="Cancel Sale"
        message={`Cancel sale ${cancelTarget?.sale_number}? Stock will be restored automatically.`}
        confirmLabel="Cancel Sale"
        variant="danger"
        loading={cancelling}
      />
    </div>
  )
}