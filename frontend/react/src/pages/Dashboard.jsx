// ============================================================
// src/pages/Dashboard.jsx
// ============================================================
import { useEffect, useRef, useState } from 'react'
import {
  TrendingUp, ShoppingCart, Package, DollarSign,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Store
} from 'lucide-react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency } from '../utils/formatters'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler)

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      borderWidth: 1,
      titleColor: '#94a3b8',
      bodyColor: '#f1f5f9',
      callbacks: {
        label: ctx => ' ' + new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(ctx.parsed.y)
      }
    }
  },
  scales: {
    x: {
      grid: { color: 'rgba(51,65,85,0.5)' },
      ticks: { color: '#64748b', font: { size: 11 } }
    },
    y: {
      grid: { color: 'rgba(51,65,85,0.5)' },
      ticks: {
        color: '#64748b',
        font: { size: 11 },
        callback: v => 'Rp ' + new Intl.NumberFormat('id-ID').format(v)
      }
    }
  }
}

function StatCard({ title, value, icon: Icon, color, subtitle, trend }) {
  const colors = {
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
    red: 'from-red-500/20 to-red-500/5 border-red-500/30 text-red-400',
  }

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center`}>
          <Icon size={20} className="current" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm font-medium text-slate-300">{title}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard').then(res => {
      setData(res.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-800 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="h-64 bg-slate-800 rounded-2xl animate-pulse" />
        <div className="h-64 bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    </div>
  )

  const { stats, daily_chart, monthly_chart, top_products, branch_performance } = data || {}

  const dailyChartData = {
    labels: daily_chart?.map(d => new Date(d.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })) || [],
    datasets: [{
      data: daily_chart?.map(d => d.total) || [],
      backgroundColor: 'rgba(16,185,129,0.2)',
      borderColor: '#10b981',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: '#10b981',
    }]
  }

  const monthlyChartData = {
    labels: monthly_chart?.map(d => {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      return months[d.month - 1]
    }) || [],
    datasets: [{
      data: monthly_chart?.map(d => d.total) || [],
      backgroundColor: 'rgba(59,130,246,0.7)',
      borderColor: '#3b82f6',
      borderWidth: 0,
      borderRadius: 6,
    }]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(stats?.today_sales)}
          icon={DollarSign}
          color="emerald"
          subtitle={`${stats?.today_transactions || 0} transactions`}
        />
        <StatCard
          title="Monthly Sales"
          value={formatCurrency(stats?.monthly_sales)}
          icon={TrendingUp}
          color="blue"
          subtitle={new Date().toLocaleString('default', { month: 'long' })}
        />
        <StatCard
          title="Total Products"
          value={stats?.total_products || 0}
          icon={Package}
          color="purple"
          subtitle="Active products"
        />
        <StatCard
          title="Low Stock Alert"
          value={stats?.low_stock_alerts || 0}
          icon={AlertTriangle}
          color={stats?.low_stock_alerts > 0 ? 'red' : 'amber'}
          subtitle="Items need restocking"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold">Daily Sales</h3>
              <p className="text-slate-400 text-sm">Last 30 days</p>
            </div>
          </div>
          <div className="h-48">
            <Line data={dailyChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold">Monthly Revenue</h3>
              <p className="text-slate-400 text-sm">Last 12 months</p>
            </div>
          </div>
          <div className="h-48">
            <Bar data={monthlyChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Top Selling Products</h3>
          <div className="space-y-3">
            {top_products?.slice(0, 7).map((product, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">{product.name}</div>
                  <div className="text-xs text-slate-400">{product.total_qty} units sold</div>
                </div>
                <div className="text-sm font-semibold text-emerald-400">
                  {formatCurrency(product.total_revenue)}
                </div>
              </div>
            ))}
            {!top_products?.length && (
              <div className="text-center py-8 text-slate-500 text-sm">No sales data yet</div>
            )}
          </div>
        </div>

        {/* Branch Performance (owner only) */}
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Branch Performance</h3>
          <div className="space-y-3">
            {branch_performance?.map((branch, i) => (
              <div key={branch.id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Store size={14} className="text-blue-400" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{branch.name}</div>
                    <div className="text-slate-400 text-xs">{branch.code}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800 rounded-lg p-2">
                    <div className="text-slate-400">Today</div>
                    <div className="text-emerald-400 font-semibold">{formatCurrency(branch.today_sales)}</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-2">
                    <div className="text-slate-400">This Month</div>
                    <div className="text-blue-400 font-semibold">{formatCurrency(branch.month_sales)}</div>
                  </div>
                </div>
              </div>
            ))}
            {!branch_performance && (
              <div className="text-center py-8 text-slate-500 text-sm">Branch data only visible to Owner</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}