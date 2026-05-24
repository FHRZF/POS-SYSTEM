import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Minus, Trash2, DollarSign, Printer, AlertCircle, ShoppingCart, X } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function POS() {
  const { user } = useAuth()
  const barcodeInputRef = useRef(null)

  // State
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: 'cash',
    paymentAmount: 0,
    discountAmount: 0,
    taxAmount: 0,
  })
  const [processing, setProcessing] = useState(false)
  const [mobileCartOpen, setMobileCartOpen] = useState(false)

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/products?per_page=100'),
          api.get('/categories'),
        ])
        setProducts(productsRes.data.data || productsRes.data)
        setCategories(categoriesRes.data.data || categoriesRes.data)
      } catch (err) {
        setError('Failed to load products')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || product.category_id == selectedCategory
    return matchesSearch && matchesCategory
  })

  // Add to cart
  const addToCart = (variant) => {
    const existingItem = cart.find(item => item.variant_id === variant.id)

    if (existingItem) {
      updateCartQuantity(variant.id, existingItem.quantity + 1)
    } else {
      setCart([...cart, {
        variant_id: variant.id,
        variant_name: variant.name,
        product_name: variant.product?.name,
        price: parseFloat(variant.price),
        quantity: 1,
        subtotal: parseFloat(variant.price),
      }])
    }
    setSuccess(`${variant.product?.name} added to cart`)
    setTimeout(() => setSuccess(''), 2000)
  }

  // Update quantity
  const updateCartQuantity = (variantId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(variantId)
      return
    }
    setCart(cart.map(item =>
      item.variant_id === variantId
        ? { ...item, quantity, subtotal: item.price * quantity }
        : item
    ))
  }

  // Remove from cart
  const removeFromCart = (variantId) => {
    setCart(cart.filter(item => item.variant_id !== variantId))
  }

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const discount = parseFloat(paymentForm.discountAmount) || 0
  const tax = parseFloat(paymentForm.taxAmount) || 0
  const total = subtotal - discount + tax

  // Handle barcode input
  const handleBarcodeInput = async (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const barcode = e.target.value.trim()
      try {
        const response = await api.get('/products/search/barcode', {
          params: { barcode, branch_id: user?.branch_id }
        })
        addToCart(response.data.data.variant)
        e.target.value = ''
      } catch (err) {
        setError('Product not found')
        setTimeout(() => setError(''), 3000)
      }
    }
  }

  // Branches (for default branch selection)
  const [branches, setBranches] = useState([])
  useEffect(() => {
    const fetchBranches = async () => {
      const res = await api.get('/branches')
      setBranches(res.data.data || res.data)
    }
    fetchBranches()
  }, [])
  const branchId = user?.branch_id || branches[0]?.id

  // Handle payment
  const handlePayment = async () => {
    if (cart.length === 0) {
      setError('Cart is empty')
      return
    }

    if (paymentForm.paymentAmount < total) {
      setError('Payment amount is less than total')
      return
    }

    setProcessing(true)
    try {
      const response = await api.post('/sales', {
        branch_id: branchId,
        items: cart.map(item => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.price,
          discount: 0,
        })),
        payment_method: paymentForm.paymentMethod,
        payment_amount: paymentForm.paymentAmount,
        discount_amount: discount,
        tax_amount: tax,
      })

      // Show success and receipt
      setSuccess('Transaction completed successfully!')
      setShowPayment(false)

      // Print receipt
      setTimeout(() => {
        printReceipt(response.data.data)
      }, 500)

      // Reset
      setCart([])
      setPaymentForm({ paymentMethod: 'cash', paymentAmount: 0, discountAmount: 0, taxAmount: 0 })

    } catch (err) {
      console.error('Payment error:', err.response?.data)
      setError(err.response?.data?.message || JSON.stringify(err.response?.data) || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  // Print receipt
  const printReceipt = (sale) => {
    const printWindow = window.open('', '_blank')
    const receiptHTML = `...` // keep existing receipt generation (omitted for brevity in patch)
    printWindow.document.write(receiptHTML)
    printWindow.document.close()
    printWindow.print()
  }

  // Reusable cart panel (desktop + mobile)
  const CartPanel = ({ mobile = false }) => (
    <div className={`${mobile ? '' : 'w-96'} flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700`}>
      {/* Cart Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cart</h2>
      </div>

      {/* Alerts */}
      {error && (
        <div className="m-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400 text-sm flex gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {success && (
        <div className="m-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-600 dark:text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-600 dark:text-slate-400">Cart is empty</div>
        ) : (
          cart.map((item) => (
            <div key={item.variant_id} className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white text-sm">{item.product_name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{item.variant_name}</p>
                </div>
                <button
                  onClick={() => removeFromCart(item.variant_id)}
                  aria-label={`Remove ${item.product_name} from cart`}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateCartQuantity(item.variant_id, item.quantity - 1)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                    aria-label={`Decrease quantity of ${item.product_name}`}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateCartQuantity(item.variant_id, item.quantity + 1)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                    aria-label={`Increase quantity of ${item.product_name}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-600 dark:text-slate-400">Rp {item.price?.toLocaleString('id-ID')}</p>
                  <p className="font-bold text-slate-900 dark:text-white">Rp {item.subtotal?.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      <div className="p-4 space-y-2 border-t border-slate-200 dark:border-slate-700">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
          <span className="font-medium text-slate-900 dark:text-white">Rp {subtotal.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Discount:</span>
          <span className="font-medium text-slate-900 dark:text-white">-Rp {discount.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Tax:</span>
          <span className="font-medium text-slate-900 dark:text-white">Rp {tax.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t border-slate-200 dark:border-slate-700 pt-2">
          <span className="text-slate-900 dark:text-white">Total:</span>
          <span className="text-emerald-600 dark:text-emerald-400">Rp {total.toLocaleString('id-ID')}</span>
        </div>
      </div>

      {/* Payment Button */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setShowPayment(true)}
          disabled={cart.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
        >
          <DollarSign size={18} />
          Proceed to Payment
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-120px)]">
        {/* Products Section */}
        <div className="flex-1 flex flex-col">
          {/* Search & Filter */}
          <div className="space-y-3 mb-4">
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan barcode here..."
              onKeyDown={handleBarcodeInput}
              autoFocus
              className="w-full bg-white dark:bg-slate-800 border-2 border-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl px-4 py-3 focus:outline-none text-lg"
            />

            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  !selectedCategory
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full text-slate-600 dark:text-slate-400">
                Loading products...
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((product) =>
                  product.variants?.map(variant => (
                    <button
                      key={variant.id}
                      onClick={() => addToCart(variant)}
                      aria-label={`Add ${product.name} ${variant.name} to cart`}
                      className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-emerald-500 dark:hover:border-emerald-500 transition-all text-left"
                    >
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{product.name}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{variant.name}</p>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-1">Rp {variant.price?.toLocaleString('id-ID')}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <CartPanel />

        {/* Mobile cart toggle */}
        <div className="lg:hidden fixed bottom-6 right-4 z-50">
          <button onClick={() => setMobileCartOpen(true)} aria-label="Open cart" className="bg-emerald-500 text-white p-3 rounded-full shadow-lg focus-visible:ring-2 focus-visible:ring-emerald-500/30">
            <ShoppingCart size={20} />
          </button>
        </div>

        {/* Mobile cart overlay */}
        {mobileCartOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 lg:hidden flex items-end">
            <div className="w-full bg-white dark:bg-slate-800 rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Cart</h2>
                <button aria-label="Close cart" onClick={() => setMobileCartOpen(false)} className="p-2 text-slate-700 dark:text-slate-200"><X size={18} /></button>
              </div>
              <CartPanel mobile={true} />
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Payment</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Total Amount</label>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">Rp {total.toLocaleString('id-ID')}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Payment Method</label>
                <select value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500">
                  <option value="cash">Cash</option>
                  <option value="qris">QRIS</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Payment Amount</label>
                <input type="number" value={paymentForm.paymentAmount} onChange={(e) => setPaymentForm({ ...paymentForm, paymentAmount: parseFloat(e.target.value) })} placeholder="0" className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500" />
              </div>

              {paymentForm.paymentAmount > total && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-600 dark:text-blue-400 text-sm">Change: Rp {(paymentForm.paymentAmount - total).toLocaleString('id-ID')}</div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowPayment(false)} className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium">Cancel</button>
              <button onClick={handlePayment} disabled={processing || paymentForm.paymentAmount < total} className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-xl transition-colors font-medium">{processing ? 'Processing...' : 'Complete Payment'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
