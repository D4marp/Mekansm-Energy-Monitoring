import { useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook untuk real-time data polling
 * Auto-refresh data dari API dengan interval tertentu
 */
export function useRealTimePolling<T>(
  fetchFunction: () => Promise<T>,
  onSuccess: (data: T) => void,
  interval: number = 5000, // Default 5 detik
  enabled: boolean = true
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPollingRef = useRef(false)

  const poll = useCallback(async () => {
    if (isPollingRef.current) return // Prevent concurrent requests

    try {
      isPollingRef.current = true
      const data = await fetchFunction()
      onSuccess(data)
    } catch (error) {
      console.error('Polling error:', error)
    } finally {
      isPollingRef.current = false
    }
  }, [fetchFunction, onSuccess])

  useEffect(() => {
    if (!enabled) return

    // Poll immediately on mount
    poll()

    // Set up interval
    intervalRef.current = setInterval(poll, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, interval, poll])

  return {
    refetch: poll,
    stop: () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    },
  }
}

/**
 * Hook untuk polling multiple endpoints
 */
export function useMultipleRealTimePolling(
  fetchFunctions: Array<{
    key: string
    fetch: () => Promise<any>
    onSuccess: (data: any) => void
  }>,
  interval: number = 5000,
  enabled: boolean = true
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPollingRef = useRef(false)

  const poll = useCallback(async () => {
    if (isPollingRef.current) return

    try {
      isPollingRef.current = true
      await Promise.all(
        fetchFunctions.map(async (fn) => {
          try {
            const data = await fn.fetch()
            fn.onSuccess(data)
          } catch (error) {
            console.error(`Polling error for ${fn.key}:`, error)
          }
        })
      )
    } finally {
      isPollingRef.current = false
    }
  }, [fetchFunctions])

  useEffect(() => {
    if (!enabled) return

    // Poll immediately on mount
    poll()

    // Set up interval
    intervalRef.current = setInterval(poll, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, interval, poll])

  return {
    refetch: poll,
    stop: () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    },
  }
}
