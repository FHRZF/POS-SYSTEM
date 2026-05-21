export const formatCurrency = (amount) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })
    .format(amount || 0)
 
export const formatDate = (date) =>
  new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
 
export const formatDateTime = (date) =>
  new Date(date).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
 
export const formatNumber = (num) =>
  new Intl.NumberFormat('id-ID').format(num || 0)
 