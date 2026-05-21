// src/pages/Categories.jsx
import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, Tag, Package } from 'lucide-react'
import api from '../services/api'
import { useToast } from '../hooks/useToast'
import {
  PageHeader, DataTable, Modal, FormField,
  Input, Textarea, Btn, Badge, SearchInput, ConfirmDialog, Toast
} from '../components/ui'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [showModal, setShowModal]   = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [editing, setEditing]       = useState(null)
  const [deleting, setDeleting]     = useState(null)
  const [saving, setSaving]         = useState(false)
  const [form, setForm]             = useState({ name: '', description: '' })
  const [errors, setErrors]         = useState({})
  const { toasts, success, error }  = useToast()

  const load = useCallback(() => {
    setLoading(true)
    api.get('/categories', { params: { search } })
      .then(r => setCategories(r.data.data || []))
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', description: '' })
    setErrors({})
    setShowModal(true)
  }

  const openEdit = (cat) => {
    setEditing(cat)
    setForm({ name: cat.name, description: cat.description || '' })
    setErrors({})
    setShowModal(true)
  }

  const confirmDelete = (cat) => { setDeleting(cat); setShowConfirm(true) }

  const handleSave = async () => {
    setErrors({})
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, form)
        success('Category updated successfully')
      } else {
        await api.post('/categories', form)
        success('Category created successfully')
      }
      setShowModal(false)
      load()
    } catch (err) {
      const e = err.response?.data?.errors || {}
      if (Object.keys(e).length) setErrors(e)
      else error(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/categories/${deleting.id}`)
      success('Category deleted')
      setShowConfirm(false)
      load()
    } catch (err) {
      error(err.response?.data?.message || 'Cannot delete')
      setShowConfirm(false)
    }
  }

  const columns = [
    {
      header: 'Category',
      render: row => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
            <Tag size={15} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-slate-900 dark:text-white font-medium">{row.name}</div>
            <div className="text-slate-400 text-xs">{row.slug}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Description',
      render: row => (
        <span className="text-slate-500 dark:text-slate-400 text-sm">
          {row.description || <span className="italic text-slate-300 dark:text-slate-600">No description</span>}
        </span>
      )
    },
    {
      header: 'Products',
      render: row => (
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <Package size={14} />
          <span className="text-sm">{row.products_count ?? 0}</span>
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
        <div className="flex items-center gap-2">
          <Btn variant="secondary" size="sm" onClick={() => openEdit(row)}>
            <Edit size={13} /> Edit
          </Btn>
          <Btn variant="danger" size="sm" onClick={() => confirmDelete(row)} disabled={row.products_count > 0}>
            <Trash2 size={13} />
          </Btn>
        </div>
      )
    },
  ]

  return (
    <div>
      <Toast toasts={toasts} />

      <PageHeader
        title="Categories"
        subtitle="Manage product categories"
        action={<Btn onClick={openCreate}><Plus size={16} /> Add Category</Btn>}
      />

      <SearchInput
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search categories..."
        className="mb-4 max-w-xs"
      />

      <DataTable columns={columns} data={categories} loading={loading} emptyMessage="No categories yet" />

      {/* Create / Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Category' : 'Add Category'} size="sm">
        <div className="space-y-4">
          <FormField label="Category Name" required error={errors.name?.[0]}>
            <Input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Electronics"
              autoFocus
            />
          </FormField>
          <FormField label="Description" error={errors.description?.[0]}>
            <Textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Short description (optional)"
              rows={3}
            />
          </FormField>
          <div className="flex gap-3 pt-1">
            <Btn onClick={handleSave} loading={saving} className="flex-1 justify-center">
              {editing ? 'Save Changes' : 'Create Category'}
            </Btn>
            <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
          </div>
        </div>
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}