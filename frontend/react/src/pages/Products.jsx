import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../services/api'
import ProductForm from '../components/ProductForm'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch products
  const fetchProducts = useCallback(async (page = 1, searchQuery = '') => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/products', {
        params: {
          page,
          search: searchQuery,
          per_page: 10,
        }
      })
      setProducts(response.data.data)
      setCurrentPage(response.data.current_page)
      setTotalPages(response.data.last_page)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchProducts(1, '')
  }, [fetchProducts])

  // Handle search
  const handleSearch = useCallback((e) => {
    setSearch(e.target.value)
    setCurrentPage(1)
    fetchProducts(1, e.target.value)
  }, [fetchProducts])

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this product?')) return

    try {
      await api.delete(`/products/${id}`)
      setSuccess('Product deactivated successfully')
      fetchProducts(currentPage, search)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product')
    }
  }

  // Handle form submit
  const handleFormSubmit = () => {
    setShowForm(false)
    setEditingProduct(null)
    fetchProducts(currentPage, search)
    setSuccess(editingProduct ? 'Product updated successfully' : 'Product created successfully')
    setTimeout(() => setSuccess(''), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Products</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your product catalog</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null)
            setShowForm(true)
          }}
          type="button"
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-600 dark:text-green-400">
          {success}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search products..."
          aria-label="Search products"
          value={search}
          onChange={handleSearch}
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-600 dark:text-slate-400">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-slate-600 dark:text-slate-400">
            No products found
          </div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="space-y-3 p-3 md:hidden">
              {products.map(product => (
                <div key={product.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{product.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{product.category?.name || '-'}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">Rp {product.base_price?.toLocaleString('id-ID')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { setEditingProduct(product); setShowForm(true) }}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        aria-label={`Edit ${product.name}`}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop / tablet: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="sticky top-0 z-10 px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700/50">Name</th>
                    <th className="sticky top-0 z-10 px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700/50">Category</th>
                    <th className="sticky top-0 z-10 px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700/50">Price</th>
                    <th className="sticky top-0 z-10 px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700/50">Variants</th>
                    <th className="sticky top-0 z-10 px-6 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700/50">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {product.category?.name}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                        Rp {product.base_price?.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {product.variants?.length} variant{product.variants?.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(product)
                              setShowForm(true)
                            }}
                            className="p-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="Edit"
                            aria-label={`Edit ${product.name}`}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="Delete"
                            aria-label={`Delete ${product.name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchProducts(currentPage - 1, search)}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => fetchProducts(currentPage + 1, search)}
              disabled={currentPage === totalPages}
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => {
            setShowForm(false)
            setEditingProduct(null)
          }}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  )
}