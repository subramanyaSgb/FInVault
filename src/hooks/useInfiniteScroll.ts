import { useState, useEffect, useRef, useCallback } from 'react'

export interface UseInfiniteScrollOptions {
  rootMargin?: string // IntersectionObserver rootMargin
  enabled?: boolean
}

export interface UseInfiniteScrollReturn<T> {
  items: T[]
  isLoading: boolean
  hasMore: boolean
  error: Error | null
  loadMore: () => void
  reset: () => void
  sentinelRef: (node: HTMLElement | null) => void
}

/**
 * Infinite scroll hook with IntersectionObserver
 */
export function useInfiniteScroll<T>(
  fetchFn: (page: number, pageSize: number) => Promise<{ items: T[]; hasMore: boolean }>,
  pageSize: number = 20,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn<T> {
  const { rootMargin = '100px', enabled = true } = options

  const [items, setItems] = useState<T[]>([])
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLElement | null>(null)

  // Load more data
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !enabled) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchFn(page, pageSize)
      setItems(prev => [...prev, ...result.items])
      setHasMore(result.hasMore)
      setPage(prev => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more items'))
    } finally {
      setIsLoading(false)
    }
  }, [fetchFn, page, pageSize, isLoading, hasMore, enabled])

  // Reset and reload
  const reset = useCallback(() => {
    setItems([])
    setPage(1)
    setHasMore(true)
    setError(null)
  }, [])

  // Set up intersection observer
  const setSentinelRef = useCallback(
    (node: HTMLElement | null) => {
      // Clean up previous observer
      if (observerRef.current) {
        observerRef.current.disconnect()
      }

      sentinelRef.current = node

      if (!node || !enabled) return

      observerRef.current = new IntersectionObserver(
        entries => {
          if (entries[0]?.isIntersecting && hasMore && !isLoading) {
            loadMore()
          }
        },
        { rootMargin, threshold: 0 }
      )

      observerRef.current.observe(node)
    },
    [loadMore, hasMore, isLoading, enabled, rootMargin]
  )

  // Initial load
  useEffect(() => {
    if (enabled && items.length === 0 && !isLoading) {
      loadMore()
    }
  }, [enabled])

  // Cleanup
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return {
    items,
    isLoading,
    hasMore,
    error,
    loadMore,
    reset,
    sentinelRef: setSentinelRef,
  }
}

/**
 * Simple pagination hook without intersection observer
 */
export function usePagination<T>(
  fetchFn: (page: number, pageSize: number) => Promise<{ items: T[]; total: number }>,
  pageSize: number = 20
) {
  const [items, setItems] = useState<T[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const totalPages = Math.ceil(total / pageSize)
  const hasNext = page < totalPages
  const hasPrev = page > 1

  const fetchPage = useCallback(
    async (pageNum: number) => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await fetchFn(pageNum, pageSize)
        setItems(result.items)
        setTotal(result.total)
        setPage(pageNum)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load page'))
      } finally {
        setIsLoading(false)
      }
    },
    [fetchFn, pageSize]
  )

  const goToPage = useCallback(
    (pageNum: number) => {
      if (pageNum >= 1 && pageNum <= totalPages) {
        fetchPage(pageNum)
      }
    },
    [fetchPage, totalPages]
  )

  const nextPage = useCallback(() => {
    if (hasNext) goToPage(page + 1)
  }, [goToPage, page, hasNext])

  const prevPage = useCallback(() => {
    if (hasPrev) goToPage(page - 1)
  }, [goToPage, page, hasPrev])

  const refresh = useCallback(() => {
    fetchPage(page)
  }, [fetchPage, page])

  // Initial load
  useEffect(() => {
    fetchPage(1)
  }, [])

  return {
    items,
    page,
    pageSize,
    total,
    totalPages,
    isLoading,
    error,
    hasNext,
    hasPrev,
    goToPage,
    nextPage,
    prevPage,
    refresh,
  }
}
