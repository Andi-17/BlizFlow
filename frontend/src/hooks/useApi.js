import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../utils/formatters'

export function useApi(fetcher, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher(...args)
      setData(result)
      return result
    } catch (err) {
      setError(getErrorMessage(err))
      throw err
    } finally {
      setLoading(false)
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!immediate) return
    execute().catch(() => {})
  }, [execute, immediate])

  return { data, loading, error, execute, setData, setError }
}
