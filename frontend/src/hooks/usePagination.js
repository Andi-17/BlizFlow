import { useCallback, useState } from 'react'

export function usePagination(initialPage = 1, initialPerPage = 15) {
  const [page, setPage] = useState(initialPage)
  const [perPage, setPerPage] = useState(initialPerPage)
  const [search, setSearch] = useState('')
  const [meta, setMeta] = useState(null)

  const params = {
    page,
    per_page: perPage,
    ...(search ? { search } : {}),
  }

  const resetPage = useCallback(() => setPage(1), [])

  const applySearch = useCallback((value) => {
    setSearch(value)
    setPage(1)
  }, [])

  return {
    page,
    setPage,
    perPage,
    setPerPage,
    search,
    setSearch,
    applySearch,
    meta,
    setMeta,
    params,
    resetPage,
  }
}
