import { useState, useEffect } from 'react'
import api from '../services/api'
 
export function useFetch(url, params = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
 
  const fetch = async () => {
    setLoading(true)
    try {
      const res = await api.get(url, { params })
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }
 
  useEffect(() => { fetch() }, [url, params])
 