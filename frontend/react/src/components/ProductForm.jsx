import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import api from '../services/api'

export default function ProductForm({ product, onClose, onSubmit }) {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    category_id: '',
    name: '',
    description: '',
    base_price: '',
    base_cost: '',
    has_variants: false,
    variants: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories')
        setCategories(response.data.data || response.data)
      } catch (err) {
        console.error('Failed to load categories', err)
      }
    }
    fetchCategories()
  }, [])

  // Load product data if editing
  useEffect(() => {
    if (product) {
      setForm({
        category_id: product.category_id,
        name: product.name,
        description: product.description || '',
        base_price: product.base_price,
        base_cost: product.base_cost || 0,
        has_variants: (product.variants?.length || 0) > 1,
        variants: product.variants || [],
      })
    }
  }, [product])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
        const data = {
        category_id: form.category_id,
        name: form.name,
        slug: form.name.toLowerCase().replace(/\s+/g, '-'), // AUTO-GENERATE
        description: form.description,
        base_price: form.base_price,
        base_cost: form.base_cost,
        has_variants: form.has_variants,
        is_active: true, // ← TAMBAHKAN INI
        }

        if (form.has_variants && form.variants.length > 0) {
        data.variants = form.variants.map(v => ({
            name: v.variant_name || v.name || '', // ← PASTIKAN ADA
            sku: v.sku || null,
            barcode: v.barcode || null,
            price: v.price,
            cost: v.cost,
        }))
        }

      if (product) {
        await api.put(`/products/${product.id}`, data)
      } else {
        await api.post('/products', data)
      }

      onSubmit()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  const addVariant = () => {
    setForm({
      ...form,
      variants: [...form.variants, {
        variant_name: '',
        sku: '',
        barcode: '',
        price: '',
        cost: '',
      }]
    })
  }

  const removeVariant = (index) => {
    setForm({
      ...form,
      variants: form.variants.filter((_, i) => i !== index)
    })
  }

  const updateVariant = (index, field, value) => {
    const updated = [...form.variants]
    updated[index] = { ...updated[index], [field]: value }
    setForm({ ...form, variants: updated })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Category *
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Product name"
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Product description"
                rows="3"
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Base Price *
                </label>
                <input
                  type="number"
                  value={form.base_price}
                  onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                  required
                  placeholder="0"
                  step="0.01"
                  min="0"
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Base Cost
                </label>
                <input
                  type="number"
                  value={form.base_cost}
                  onChange={(e) => setForm({ ...form, base_cost: e.target.value })}
                  placeholder="0"
                  step="0.01"
                  min="0"
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="has_variants"
                checked={form.has_variants}
                onChange={(e) => setForm({ ...form, has_variants: e.target.checked, variants: e.target.checked ? form.variants : [] })}
                className="w-4 h-4"
              />
              <label htmlFor="has_variants" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                This product has variants (sizes, colors, etc.)
              </label>
            </div>

            {form.has_variants && (
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-700">
                {form.variants.map((variant, index) => (
                  <div key={index} className="space-y-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Variant {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Variant name (e.g., Red, Large)"
                        value={variant.variant_name || variant.name || ''}
                        onChange={(e) => updateVariant(index, 'variant_name', e.target.value)}
                        className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="SKU"
                        value={variant.sku || ''}
                        onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                        className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Barcode"
                        value={variant.barcode || ''}
                        onChange={(e) => updateVariant(index, 'barcode', e.target.value)}
                        className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={variant.price || ''}
                        onChange={(e) => updateVariant(index, 'price', e.target.value)}
                        step="0.01"
                        min="0"
                        className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Cost"
                        value={variant.cost || ''}
                        onChange={(e) => updateVariant(index, 'cost', e.target.value)}
                        step="0.01"
                        min="0"
                        className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none col-span-1"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addVariant}
                  className="flex items-center gap-2 px-3 py-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus size={16} />
                  Add Variant
                </button>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-xl transition-colors font-medium"
            >
              {loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}