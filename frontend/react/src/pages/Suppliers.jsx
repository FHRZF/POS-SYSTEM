// src/pages/Suppliers.jsx
import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, Truck, Phone, Mail, User } from 'lucide-react'
import api from '../services/api'
import { useToast } from '../hooks/useToast'
import {
  PageHeader, DataTable, Modal, FormField,
  Input, Textarea, Btn, Badge, SearchInput, ConfirmDialog, Toast
} from '../components/ui'

const EMPTY = { name:'', code:'', contact_person:'', phone:'', email:'', address:'' }

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [deleting, setDeleting]   = useState(null)
  const [form, setForm]           = useState(EMPTY)
  const [errors, setErrors]       = useState({})
  const [saving, setSaving]       = useState(false)
  const { toasts, success, error }= useToast()

  const load = useCallback(() => {
    setLoading(true)
    api.get('/suppliers').then(r => setSuppliers(r.data.data || [])).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code?.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_person?.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setEditing(null); setForm(EMPTY); setErrors({}); setShowModal(true) }

  const openEdit = (s) => {
    setEditing(s)
    setForm({ name:s.name, code:s.code||'', contact_person:s.contact_person||'', phone:s.phone||'', email:s.email||'', address:s.address||'' })
    setErrors({})
    setShowModal(true)
  }

  const handleSave = async () => {
    setErrors({})
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/suppliers/${editing.id}`, form)
        success('Supplier updated')
      } else {
        await api.post('/suppliers', form)
        success('Supplier created')
      }
      setShowModal(false)
      load()
    } catch (err) {
      const e = err.response?.data?.errors || {}
      if (Object.keys(e).length) setErrors(e)
      else error(err.response?.data?.message || 'Failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/suppliers/${deleting.id}`)
      success('Supplier deleted')
      setShowConfirm(false)
      load()
    } catch (err) { error(err.response?.data?.message || 'Cannot delete') }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const columns = [
    {
      header: 'Supplier',
      render: row => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-100 dark:border-amber-500/20">
            <Truck size={17} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="text-slate-900 dark:text-white font-semibold">{row.name}</div>
            {row.code && <div className="text-slate-400 text-xs font-mono">{row.code}</div>}
          </div>
        </div>
      )
    },
    {
      header: 'Contact Person',
      render: row => row.contact_person
        ? <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400"><User size={13} />{row.contact_person}</div>
        : <span className="text-slate-300 dark:text-slate-600 italic text-sm">—</span>
    },
    {
      header: 'Contact',
      render: row => (
        <div className="space-y-0.5 text-sm text-slate-500 dark:text-slate-400">
          {row.phone && <div className="flex items-center gap-1.5"><Phone size={12}/>{row.phone}</div>}
          {row.email && <div className="flex items-center gap-1.5"><Mail size={12}/>{row.email}</div>}
        </div>
      )
    },
    {
      header: 'Status',
      render: row => <Badge color={row.is_active ? 'emerald' : 'red'}>{row.is_active ? 'Active' : 'Inactive'}</Badge>
    },
    {
      header: 'Actions',
      render: row => (
        <div className="flex gap-2">
          <Btn variant="secondary" size="sm" onClick={() => openEdit(row)}><Edit size={13}/> Edit</Btn>
          <Btn variant="danger" size="sm" onClick={() => { setDeleting(row); setShowConfirm(true) }}><Trash2 size={13}/></Btn>
        </div>
      )
    }
  ]

  return (
    <div>
      <Toast toasts={toasts} />

      <PageHeader
        title="Suppliers"
        subtitle="Manage your product suppliers"
        action={<Btn onClick={openCreate}><Plus size={16}/> Add Supplier</Btn>}
      />

      <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search supplier..." className="mb-4 max-w-xs" />

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No suppliers yet" />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Supplier Name" required error={errors.name?.[0]}>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="PT. Supplier Jaya" autoFocus />
            </FormField>
            <FormField label="Code" error={errors.code?.[0]} hint="Optional unique code">
              <Input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="SUP001" />
            </FormField>
          </div>

          <FormField label="Contact Person" error={errors.contact_person?.[0]}>
            <Input value={form.contact_person} onChange={e => set('contact_person', e.target.value)} placeholder="Person in charge" />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Phone" error={errors.phone?.[0]}>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="08xxxxxxxxxx" />
            </FormField>
            <FormField label="Email" error={errors.email?.[0]}>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="supplier@email.com" />
            </FormField>
          </div>

          <FormField label="Address" error={errors.address?.[0]}>
            <Textarea value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" rows={2} />
          </FormField>

          <div className="flex gap-3 pt-1">
            <Btn onClick={handleSave} loading={saving} className="flex-1 justify-center">
              {editing ? 'Save Changes' : 'Create Supplier'}
            </Btn>
            <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Supplier"
        message={`Delete "${deleting?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}