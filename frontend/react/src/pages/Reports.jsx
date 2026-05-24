// src/pages/Reports.jsx
import { useState, useEffect, useCallback } from 'react'
import { BarChart3, TrendingUp, ShoppingCart, CreditCard, QrCode, Banknote, Filter } from 'lucide-react'
import BarChartLazy from '../components/Chart/BarChartLazy'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import {
  PageHeader, Btn, Select, Badge, Card, StatsCard
} from '../components/ui'
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters'

// Chart.js will be registered dynamically by the lazy loader when needed

export default function Reports() {
  const { user } = useAuth()
  const today = new Date().toISOString().split('T')[0]
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [filters, setFilters] = useState({ start_date: firstDay, end_date: today, branch_id: user?.branch_id || '' })
  const [data, setData]       = useState(null)
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/branches').then(r => setBranches(r.data.data || []))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/reports/sales', { params: filters })
      setData(r.data)
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }, [filters])

  useEffect(() => { load() }, [load])

  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  // Group daily data for chart
  const dailyMap = {}
  data?.sales?.forEach(s => {
    const d = s.sale_date?.split('T')[0] || s.sale_date?.split(' ')[0]
    dailyMap[d] = (dailyMap[d] || 0) + parseFloat(s.total_amount)
  })
  const chartLabels = Object.keys(dailyMap).sort()
  const chartData = {
    labels: chartLabels.map(d => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })),
    datasets: [{
      label: 'Revenue',
      data: chartLabels.map(d => dailyMap[d]),
      backgroundColor: 'rgba(16,185,129,0.7)',
      borderColor: '#10b981',
      borderWidth: 0,
      borderRadius: 6,
    }]
  }

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#94a3b8',
        bodyColor: '#f1f5f9',
        callbacks: { label: ctx => ' ' + formatCurrency(ctx.parsed.y) }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(100,116,139,0.1)' },
        ticks: { color: '#64748b', font: { size: 11 }, callback: v => 'Rp ' + (v / 1000) + 'K' }
      }
    }
  }

  const paymentSummary = data?.summary?.by_payment_method || {}

  return (
    <div>
      <PageHeader title="Sales Report" subtitle="Analyze your sales performance" />

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 mb-6 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">From Date</label>
          <input
            type="date"
            value={filters.start_date}
            onChange={e => set('start_date', e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">To Date</label>
          <input
            type="date"
            value={filters.end_date}
            onChange={e => set('end_date', e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        {branches.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Branch</label>
            <Select value={filters.branch_id} onChange={e => set('branch_id', e.target.value)} className="w-auto">
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
        )}
        <Btn onClick={load} loading={loading} className="mb-0">
          <Filter size={15}/> Generate Report
        </Btn>

        {/* Quick presets */}
        <div className="flex gap-2 ml-auto">
          {[
            { label: 'Today',     start: today, end: today },
            { label: 'This Week', start: (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().split('T')[0] })(), end: today },
            { label: 'This Month',start: firstDay, end: today },
          ].map(p => (
            <button
              key={p.label}
              onClick={() => { setFilters(f => ({ ...f, start_date: p.start, end_date: p.end })) }}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:text-emerald-700 dark:hover:text-emerald-400 bg-white dark:bg-slate-800 transition-all"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
        </div>
      )}

      {!loading && data && (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total Revenue"      value={formatCurrency(data.summary?.total_revenue)}    icon={TrendingUp}   color="emerald" />
            <StatsCard title="Transactions"        value={data.summary?.total_transactions || 0}          icon={ShoppingCart} color="blue"    />
            <StatsCard title="Avg. Order Value"    value={formatCurrency(data.summary?.average_transaction)} icon={BarChart3} color="purple" />
            <StatsCard title="Total Discount"      value={formatCurrency(data.summary?.total_discount)}  icon={TrendingUp}   color="amber"   />
          </div>

          {/* Daily chart + payment breakdown */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Chart */}
            <Card className="lg:col-span-2 p-5">
              <h3 className="text-slate-900 dark:text-white font-semibold mb-4">Daily Revenue Breakdown</h3>
              <div className="h-56">
                {chartLabels.length > 0
                  ? <BarChartLazy data={chartData} options={chartOptions} />
                  : <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data to display</div>
                }
              </div>
            </Card>

            {/* Payment breakdown */}
            <Card className="p-5">
              <h3 className="text-slate-900 dark:text-white font-semibold mb-4">Payment Methods</h3>
              <div className="space-y-3">
                {[
                  { key:'cash',          label:'Cash',          icon: Banknote,  color:'emerald' },
                  { key:'qris',          label:'QRIS',          icon: QrCode,    color:'purple' },
                  { key:'bank_transfer', label:'Bank Transfer', icon: CreditCard,color:'blue'   },
                ].map(pm => {
                  const pmData = paymentSummary[pm.key]
                  const pct = data.summary?.total_transactions > 0
                    ? Math.round((pmData?.count || 0) / data.summary.total_transactions * 100) : 0
                  return (
                    <div key={pm.key} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                        ${pm.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : ''}
                        ${pm.color === 'purple'  ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400' : ''}
                        ${pm.color === 'blue'    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : ''}
                      `}>
                        <pm.icon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{pm.label}</span>
                          <span className="text-slate-400 text-xs">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                          <div
                            className={`h-full rounded-full transition-all ${pm.color === 'emerald' ? 'bg-emerald-500' : pm.color === 'purple' ? 'bg-purple-500' : 'bg-blue-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                          {pmData?.count || 0} txn · {formatCurrency(pmData?.total || 0)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* Transactions table */}
          <Card>
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
              <h3 className="text-slate-900 dark:text-white font-semibold">Transaction Detail</h3>
              <span className="text-slate-400 text-sm">{data.sales?.length} transactions</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
                    {['Sale #', 'Date', 'Cashier', 'Branch', 'Payment', 'Total', 'Status'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {data.sales?.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-10 text-slate-400 dark:text-slate-500">No sales in this period</td></tr>
                  )}
                  {data.sales?.slice(0, 50).map((sale, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 text-slate-900 dark:text-white font-mono text-xs">{sale.sale_number}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{formatDateTime(sale.sale_date)}</td>
                      <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{sale.user?.name}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{sale.branch?.name}</td>
                      <td className="px-5 py-3">
                        <Badge color={sale.payment?.payment_method === 'cash' ? 'slate' : sale.payment?.payment_method === 'qris' ? 'purple' : 'blue'}>
                          {sale.payment?.payment_method || '—'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">{formatCurrency(sale.total_amount)}</td>
                      <td className="px-5 py-3">
                        <Badge color={sale.status === 'completed' ? 'emerald' : sale.status === 'cancelled' ? 'red' : 'amber'}>{sale.status}</Badge>
                      </td>
                    </tr>
                  ))}
                  {data.sales?.length > 50 && (
                    <tr>
                      <td colSpan={7} className="text-center py-3 text-slate-400 dark:text-slate-500 text-sm">
                        Showing first 50 of {data.sales.length} transactions
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {!loading && !data && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart3 size={56} className="text-slate-200 dark:text-slate-700 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Click "Generate Report" to view data</p>
        </div>
      )}
    </div>
  )
}