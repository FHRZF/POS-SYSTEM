// src/pages/Purchases.jsx
import { useState, useEffect, useCallback } from 'react'
import { Plus, Truck, Eye, Package, Trash2, Search } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/useToast'
import {
  PageHeader, DataTable, Modal, FormField,
  Input, Select, Btn, Badge, SearchInput, Toast, Card
} from '../components/ui'
import { formatCurrency, formatDate } from '../utils/formatters'

const STATUS_COLOR = { pending:'amber', received:'emerald', cancelled:'red' }

export default function Purchases() {
  const { user } = useAuth()
  const [purchases, setPurchases] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [branches,  setBranches]  = useState([])
  const [variants,  setVariants]  = useState([])
  const [varSearch, setVarSearch] = useState('')
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [viewDetail, setViewDetail] = useState(null)
  const [saving, setSaving]       = useState(false)
  const { toasts, success, error }= useToast()

  const today = new Date().toISOString().split('T')[0]
  const EMPTY_FORM = {
    branch_id: user?.branch_id || '',
    supplier_id: '',
    purchase_date: today,
    notes: '',
    items: [{ variant_id:'', variant_label:'', quantity:'', unit_cost:'' }]
  }
  const [form, setForm] = useState(EMPTY_FORM)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/purchases').then(r => setPurchases(r.data.data || [])).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    api.get('/suppliers', { params: { active:true } }).then(r => setSuppliers(r.data.data || []))
    api.get('/branches').then(r => setBranches(r.data.data || []))
  }, [load])

  // Search variants for autocomplete
  useEffect(() => {
    if (varSearch.length < 2) { setVariants([]); return }
    api.get('/products', { params: { search: varSearch, active: true, per_page: 30 } })
      .then(r => {
        const vars = []
        ;(r.data.data || []).forEach(p => p.variants?.forEach(v => vars.push({ ...v, product_name: p.name })))
        setVariants(vars)
      })
  }, [varSearch])

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { variant_id:'', variant_label:'', quantity:'', unit_cost:'' }] }))

  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_,idx) => idx !== i) }))

  const setItem = (i, key, val) => setForm(f => ({
    ...f,
    items: f.items.map((item, idx) => idx === i ? { ...item, [key]: val } : item)
  }))

  const selectVariant = (i, variant) => {
    setItem(i, 'variant_id', variant.id)
    setItem(i, 'variant_label', `${variant.product_name} — ${variant.variant_name}`)
    setItem(i, 'unit_cost', variant.cost || '')
    setVarSearch('')
    setVariants([])
  }

  const totalAmount = form.items.reduce((s, it) => s + (parseFloat(it.quantity) * parseFloat(it.unit_cost) || 0), 0)

  const handleSave = async () => {
    const validItems = form.items.filter(it => it.variant_id && it.quantity && it.unit_cost)
    if (!form.branch_id)       { error('Please select a branch'); return }
    if (validItems.length === 0) { error('Add at least one item'); return }
    setSaving(true)
    try {
      await api.post('/purchases', { ...form, items: validItems })
      success('Purchase recorded & stock updated')
      setShowModal(false)
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save purchase')
    } finally { setSaving(false) }
  }

  const columns = [
    {
      header: 'Purchase #',
      render: row => (
        <div>
          <div className="text-slate-900 dark:text-white font-semibold text-sm font-mono">{row.purchase_number}</div>
          <div className="text-slate-400 text-xs">{formatDate(row.purchase_date)}</div>
        </div>
      )
    },
    {
      header: 'Branch',
      render: row => <span className="text-slate-600 dark:text-slate-400 text-sm">{row.branch?.name}</span>
    },
    {
      header: 'Supplier',
      render: row => row.supplier
        ? <span className="text-slate-700 dark:text-slate-300 text-sm">{row.supplier.name}</span>
        : <span className="text-slate-300 dark:text-slate-600 italic text-sm">Direct</span>
    },
    {
      header: 'Items',
      render: row => (
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm">
          <Package size={13}/>{row.items_count ?? 0} items
        </div>
      )
    },
    {
      header: 'Total',
      render: row => <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(row.total_amount)}</span>
    },
    {
      header: 'Status',
      render: row => <Badge color={STATUS_COLOR[row.status] || 'slate'}>{row.status}</Badge>
    },
    {
      header: 'Actions',
      render: row => (
        <Btn variant="secondary" size="sm" onClick={() => {
          api.get(`/purchases/${row.id}`).then(r => setViewDetail(r.data.data))
        }}>
          <Eye size={13}/> View
        </Btn>
      )
    }
  ]

  return (
    <div>
      <Toast toasts={toasts} />

      <PageHeader
        title="Purchases"
        subtitle="Record stock purchases and restocking"
        action={<Btn type="button" onClick={() => { setForm(EMPTY_FORM); setShowModal(true) }} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><Plus size={16}/> New Purchase</Btn>}
      />

      {/* Mobile purchase cards */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="p-4 text-slate-600 dark:text-slate-400">Loading purchases...</div>
        ) : purchases.length === 0 ? (
          <div className="p-4 text-slate-600 dark:text-slate-400">No purchases recorded yet</div>
        ) : (
          purchases.map(p => (
            <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-mono text-slate-700 dark:text-slate-300">{p.purchase_number}</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{formatDate(p.purchase_date)}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{p.supplier?.name || 'Direct'} • {p.branch?.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(p.total_amount)}</div>
                  <div className="mt-1"><Badge color={STATUS_COLOR[p.status] || 'slate'}>{p.status}</Badge></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block">
        <DataTable columns={columns} data={purchases} loading={loading} emptyMessage="No purchases recorded yet" />
      </div>

      {/* New Purchase Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Purchase Order" size="xl">
        <div className="space-y-5">
          {/* Header info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <FormField label="Branch" required>
              <Select value={form.branch_id} onChange={e => setForm(f => ({ ...f, branch_id: e.target.value }))} disabled={!!user?.branch_id}>
                <option value="">Select branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Supplier">
              <Select value={form.supplier_id} onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))}>
                <option value="">Direct / No Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Date" required>
              <Input type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} />
            </FormField>
            <FormField label="Notes">
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
            </FormField>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-slate-900 dark:text-white font-semibold text-sm">Purchase Items</h4>
              <Btn variant="secondary" size="sm" onClick={addItem}><Plus size={13}/> Add Item</Btn>
            </div>

            {/* Variant search */}
            <div className="relative mb-3">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5">
                <Search size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  value={varSearch}
                  onChange={e => setVarSearch(e.target.value)}
                  placeholder="Search product to add..."
                  aria-label="Search product to add"
                  className="flex-1 text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                />
              </div>
              {variants.length > 0 && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                  {variants.map(v => (
                    <button key={v.id} type="button" onClick={() => selectVariant(form.items.length - 1, v)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="text-slate-900 dark:text-white text-sm font-medium">{v.product_name}</div>
                      <div className="text-slate-400 text-xs">{v.variant_name} · {v.sku || 'no SKU'} · Cost: {formatCurrency(v.cost)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <div className="col-span-5">
                    <div className="text-slate-900 dark:text-white text-sm truncate">
                      {item.variant_label || <span className="text-slate-400 italic">No product selected</span>}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <Input type="number" min="1" value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} placeholder="Qty" />
                  </div>
                  <div className="col-span-3">
                    <Input type="number" min="0" value={item.unit_cost} onChange={e => setItem(i, 'unit_cost', e.target.value)} placeholder="Cost/unit" />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button type="button" onClick={() => removeItem(i)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" aria-label="Remove item">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Total Amount</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Btn type="button" onClick={handleSave} loading={saving} className="flex-1 justify-center">Save Purchase & Update Stock</Btn>
            <Btn type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!viewDetail} onClose={() => setViewDetail(null)} title={`Purchase: ${viewDetail?.purchase_number}`} size="lg">
        {viewDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {[
                ['Branch', viewDetail.branch?.name],
                ['Supplier', viewDetail.supplier?.name || 'Direct'],
                ['Date', formatDate(viewDetail.purchase_date)],
                ['Status', viewDetail.status],
                ['Created by', viewDetail.user?.name],
                ['Notes', viewDetail.notes || '—'],
              ].map(([label, val]) => (
                <div key={label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                  <div className="text-slate-400 text-xs mb-0.5">{label}</div>
                  <div className="text-slate-900 dark:text-white font-medium capitalize">{val}</div>
                </div>
              ))}
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left text-slate-500 dark:text-slate-400 font-medium pb-2">Product</th>
                  <th className="text-right text-slate-500 dark:text-slate-400 font-medium pb-2">Qty</th>
                  <th className="text-right text-slate-500 dark:text-slate-400 font-medium pb-2">Cost</th>
                  <th className="text-right text-slate-500 dark:text-slate-400 font-medium pb-2">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {viewDetail.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2.5 text-slate-900 dark:text-white">
                      {item.variant?.product?.name} — {item.variant?.variant_name}
                    </td>
                    <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">{item.quantity}</td>
                    <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">{formatCurrency(item.unit_cost)}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-900 dark:text-white">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 dark:border-slate-700">
                  <td colSpan={3} className="pt-3 text-right font-bold text-slate-900 dark:text-white">Total</td>
                  <td className="pt-3 text-right font-bold text-emerald-600 dark:text-emerald-400 text-base">{formatCurrency(viewDetail.total_amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Modal>
    </div>
  )
}