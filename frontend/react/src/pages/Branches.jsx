// src/pages/Branches.jsx
import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Building2, MapPin, Phone, Mail, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '../services/api'
import { useToast } from '../hooks/useToast'
import {
  PageHeader, DataTable, Modal, FormField,
  Input, Btn, Badge, SearchInput, Toast, Card
} from '../components/ui'

const EMPTY = { name:'', code:'', address:'', phone:'', email:'', city:'', province:'' }

export default function Branches() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [errors, setErrors]     = useState({})
  const [saving, setSaving]     = useState(false)
  const { toasts, success, error } = useToast()

  const load = useCallback(() => {
    setLoading(true)
    api.get('/branches').then(r => setBranches(r.data.data || [])).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = branches.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.code.toLowerCase().includes(search.toLowerCase()) ||
    b.city?.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setEditing(null); setForm(EMPTY); setErrors({}); setShowModal(true) }

  const openEdit = (b) => {
    setEditing(b)
    setForm({ name:b.name, code:b.code, address:b.address, phone:b.phone||'', email:b.email||'', city:b.city||'', province:b.province||'' })
    setErrors({})
    setShowModal(true)
  }

  const handleSave = async () => {
    setErrors({})
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/branches/${editing.id}`, form)
        success('Branch updated')
      } else {
        await api.post('/branches', form)
        success('Branch created')
      }
      setShowModal(false)
      load()
    } catch (err) {
      const e = err.response?.data?.errors || {}
      if (Object.keys(e).length) setErrors(e)
      else error(err.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const toggleStatus = async (b) => {
    await api.put(`/branches/${b.id}`, { is_active: !b.is_active })
    success(`Branch ${!b.is_active ? 'activated' : 'deactivated'}`)
    load()
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const columns = [
    {
      header: 'Branch',
      render: row => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
            <Building2 size={17} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-slate-900 dark:text-white font-semibold">{row.name}</div>
            <div className="text-slate-400 text-xs font-mono">{row.code}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Location',
      render: row => (
        <div className="flex items-start gap-1.5 text-slate-500 dark:text-slate-400 text-sm max-w-xs">
          <MapPin size={13} className="mt-0.5 flex-shrink-0" />
          <span className="truncate">{[row.city, row.province].filter(Boolean).join(', ') || row.address}</span>
        </div>
      )
    },
    {
      header: 'Contact',
      render: row => (
        <div className="space-y-0.5 text-sm text-slate-500 dark:text-slate-400">
          {row.phone && <div className="flex items-center gap-1.5"><Phone size={12} />{row.phone}</div>}
          {row.email && <div className="flex items-center gap-1.5"><Mail size={12} />{row.email}</div>}
        </div>
      )
    },
    {
      header: 'Staff',
      render: row => (
        <span className="text-slate-600 dark:text-slate-400 text-sm">{row.users_count ?? 0} users</span>
      )
    },
    {
      header: 'Status',
      render: row => <Badge color={row.is_active ? 'emerald' : 'red'}>{row.is_active ? 'Active' : 'Inactive'}</Badge>
    },
    {
      header: 'Actions',
      render: row => (
        <div className="flex items-center gap-2">
          <Btn variant="secondary" size="sm" onClick={() => openEdit(row)}><Edit size={13} /> Edit</Btn>
          <button
            onClick={() => toggleStatus(row)}
            className={`p-1.5 rounded-lg transition-colors ${row.is_active ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            title={row.is_active ? 'Deactivate' : 'Activate'}
          >
            {row.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          </button>
        </div>
      )
    }
  ]

  return (
    <div>
      <Toast toasts={toasts} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Building2 size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{branches.length}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Total Branches</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <Building2 size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{branches.filter(b => b.is_active).length}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Active Branches</div>
          </div>
        </Card>
      </div>

      <PageHeader
        title="Branches"
        subtitle="Manage your store branches"
        action={<Btn onClick={openCreate}><Plus size={16} /> Add Branch</Btn>}
      />

      <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search branch name, code, city..." className="mb-4 max-w-sm" />

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No branches found" />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Branch' : 'Add Branch'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Branch Name" required error={errors.name?.[0]}>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Main Store" autoFocus />
            </FormField>
            <FormField label="Branch Code" required error={errors.code?.[0]} hint="Unique identifier e.g. BR001">
              <Input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="BR001" />
            </FormField>
          </div>

          <FormField label="Address" required error={errors.address?.[0]}>
            <Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full street address" />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="City" error={errors.city?.[0]}>
              <Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Surabaya" />
            </FormField>
            <FormField label="Province" error={errors.province?.[0]}>
              <Input value={form.province} onChange={e => set('province', e.target.value)} placeholder="East Java" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Phone" error={errors.phone?.[0]}>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="08xxxxxxxxxx" />
            </FormField>
            <FormField label="Email" error={errors.email?.[0]}>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="branch@email.com" />
            </FormField>
          </div>

          <div className="flex gap-3 pt-2">
            <Btn onClick={handleSave} loading={saving} className="flex-1 justify-center">
              {editing ? 'Save Changes' : 'Create Branch'}
            </Btn>
            <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}