// src/pages/Users.jsx
import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Users as UsersIcon, Shield, Building2, ToggleLeft, ToggleRight, Eye, EyeOff } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/useToast'
import {
  PageHeader, DataTable, Modal, FormField,
  Input, Select, Btn, Badge, SearchInput, Toast, StatsCard
} from '../components/ui'

const ROLE_COLOR = { owner:'purple', admin:'blue', cashier:'emerald' }
const EMPTY = { role_id:'', branch_id:'', name:'', email:'', password:'', phone:'', is_active: true }

export default function Users() {
  const { user: currentUser } = useAuth()
  const [users, setUsers]     = useState([])
  const [roles, setRoles]     = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [errors, setErrors]   = useState({})
  const [saving, setSaving]   = useState(false)
  const [showPw, setShowPw]   = useState(false)
  const { toasts, success, error } = useToast()

  const load = useCallback(() => {
    setLoading(true)
    api.get('/users', { params: { role: roleFilter, per_page: 50 } })
      .then(r => setUsers(r.data.data || []))
      .finally(() => setLoading(false))
  }, [roleFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    Promise.all([
      api.get('/roles').then(r => setRoles(r.data.data || [])).catch(() => {
        setRoles([{ id:1, name:'owner', display_name:'Owner' }, { id:2, name:'admin', display_name:'Admin' }, { id:3, name:'cashier', display_name:'Cashier' }])
      }),
      api.get('/branches').then(r => setBranches(r.data.data || []))
    ])
  }, [])

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setEditing(null); setForm(EMPTY); setErrors({}); setShowPw(false); setShowModal(true) }

  const openEdit = (u) => {
    setEditing(u)
    setForm({ role_id:u.role_id, branch_id:u.branch_id||'', name:u.name, email:u.email, password:'', phone:u.phone||'', is_active:u.is_active })
    setErrors({})
    setShowPw(false)
    setShowModal(true)
  }

  const handleSave = async () => {
    setErrors({})
    setSaving(true)
    const payload = { ...form }
    if (!payload.password) delete payload.password
    if (!payload.branch_id) payload.branch_id = null
    try {
      if (editing) {
        await api.put(`/users/${editing.id}`, payload)
        success('User updated')
      } else {
        await api.post('/users', payload)
        success('User created')
      }
      setShowModal(false)
      load()
    } catch (err) {
      const e = err.response?.data?.errors || {}
      if (Object.keys(e).length) setErrors(e)
      else error(err.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const toggleStatus = async (u) => {
    if (u.id === currentUser.id) { error("You can't deactivate yourself"); return }
    await api.put(`/users/${u.id}`, { is_active: !u.is_active })
    success(`User ${!u.is_active ? 'activated' : 'deactivated'}`)
    load()
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const roleCount = (name) => users.filter(u => u.role?.name === name).length

  const columns = [
    {
      header: 'User',
      render: row => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-slate-900 dark:text-white font-semibold text-sm">{row.name}</div>
            <div className="text-slate-400 text-xs">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Role',
      render: row => (
        <div className="flex items-center gap-1.5">
          <Shield size={13} className="text-slate-400" />
          <Badge color={ROLE_COLOR[row.role?.name] || 'slate'}>{row.role?.display_name}</Badge>
        </div>
      )
    },
    {
      header: 'Branch',
      render: row => row.branch
        ? <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400"><Building2 size={13}/>{row.branch.name}</div>
        : <Badge color="purple">All Branches</Badge>
    },
    {
      header: 'Phone',
      render: row => <span className="text-slate-500 dark:text-slate-400 text-sm">{row.phone || '—'}</span>
    },
    {
      header: 'Status',
      render: row => <Badge color={row.is_active ? 'emerald' : 'red'}>{row.is_active ? 'Active' : 'Inactive'}</Badge>
    },
    {
      header: 'Actions',
      render: row => (
        <div className="flex items-center gap-2">
          <Btn variant="secondary" size="sm" onClick={() => openEdit(row)}><Edit size={13}/> Edit</Btn>
          {row.id !== currentUser.id && (
            <button
              onClick={() => toggleStatus(row)}
              className={`p-1.5 rounded-lg transition-colors ${row.is_active ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title={row.is_active ? 'Deactivate' : 'Activate'}
            >
              {row.is_active ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <div>
      <Toast toasts={toasts} />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Users"  value={users.length}       icon={UsersIcon} color="blue"   />
        <StatsCard title="Owners"       value={roleCount('owner')} icon={Shield}    color="purple" />
        <StatsCard title="Admins"       value={roleCount('admin')} icon={Shield}    color="blue"   />
        <StatsCard title="Cashiers"     value={roleCount('cashier')} icon={UsersIcon} color="emerald" />
      </div>

          <PageHeader
            title="Users"
            subtitle="Manage system users and their roles"
            action={<Btn type="button" onClick={openCreate} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><Plus size={16}/> Add User</Btn>}
          />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..." className="max-w-xs" />
        <div className="flex gap-2">
          {['', 'owner','admin','cashier'].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                roleFilter === r
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {r === '' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile list */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="p-4 text-slate-600 dark:text-slate-400">Loading users...</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-slate-600 dark:text-slate-400">No users found</div>
        ) : (
          filtered.map(u => (
            <div key={u.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{u.name?.charAt(0)?.toUpperCase()}</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{u.name}</div>
                    <div className="text-xs text-slate-400">{u.email}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{u.role?.display_name} • {u.branch?.name || 'All branches'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Btn type="button" variant="secondary" size="sm" onClick={() => openEdit(u)} aria-label={`Edit ${u.name}`}><Edit size={13}/> Edit</Btn>
                  {u.id !== currentUser.id && (
                    <button
                      type="button"
                      onClick={() => toggleStatus(u)}
                      className={`p-1.5 rounded-lg transition-colors ${u.is_active ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      aria-label={u.is_active ? 'Deactivate user' : 'Activate user'}
                    >
                      {u.is_active ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block">
        <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No users found" />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit User' : 'Add User'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Full Name" required error={errors.name?.[0]}>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="User full name" autoFocus />
            </FormField>
            <FormField label="Email" required error={errors.email?.[0]}>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="user@email.com" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Role" required error={errors.role_id?.[0]}>
              <Select value={form.role_id} onChange={e => set('role_id', e.target.value)}>
                <option value="">Select role</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.display_name}</option>)}
              </Select>
            </FormField>
            <FormField label="Branch" hint="Leave blank for all branches">
              <Select value={form.branch_id} onChange={e => set('branch_id', e.target.value)}>
                <option value="">All Branches</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </FormField>
          </div>

          <FormField label="Phone" error={errors.phone?.[0]}>
            <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="08xxxxxxxxxx" />
          </FormField>

          <FormField
            label={editing ? 'New Password' : 'Password'}
            required={!editing}
            hint={editing ? 'Leave blank to keep current password' : undefined}
            error={errors.password?.[0]}
          >
            <div className="relative">
              <Input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder={editing ? 'Enter new password to change' : 'Min. 8 characters'}
                className="pr-10"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </FormField>

          {editing && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={e => set('is_active', e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <label htmlFor="is_active" className="text-slate-700 dark:text-slate-300 text-sm">Account is active</label>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Btn onClick={handleSave} loading={saving} className="flex-1 justify-center">
              {editing ? 'Save Changes' : 'Create User'}
            </Btn>
            <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}