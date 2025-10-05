'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export function DebugBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    apiCalls: 0,
    memory: 0,
    cachedQueries: 0,
  })
  const renderStartTime = useRef<number>(0)
  const apiCallsRef = useRef<number>(0)

  // Reset metrics and start timer on route change
  useEffect(() => {
    renderStartTime.current = performance.now()
    apiCallsRef.current = 0

    setMetrics(m => ({
      ...m,
      renderTime: 0,
      apiCalls: 0,
    }))

    // Update render time continuously until no more API calls
    const updateTimer = setInterval(() => {
      const renderTime = Math.round(performance.now() - renderStartTime.current)
      const memory = (performance as any).memory
        ? Math.round((performance as any).memory.usedJSHeapSize / 1048576)
        : 0

      setMetrics(m => ({
        ...m,
        renderTime,
        memory,
      }))
    }, 50)

    // Stop after 3 seconds max
    const stopTimer = setTimeout(() => {
      clearInterval(updateTimer)
    }, 3000)

    return () => {
      clearInterval(updateTimer)
      clearTimeout(stopTimer)
    }
  }, [pathname])

  // Track API calls with fetch interceptor
  useEffect(() => {
    const originalFetch = window.fetch

    window.fetch = function(...args) {
      const url = args[0].toString()

      if (url.includes('/api/')) {
        apiCallsRef.current++
        setMetrics(m => ({ ...m, apiCalls: apiCallsRef.current }))
      }

      return originalFetch.apply(this, args)
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white shadow-lg">
      {/* Toggle bar */}
      <div
        className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <span className="font-bold text-blue-400">🔧 Debug Bar</span>
          <div className="flex gap-4 text-sm">
            <span>🎨 {metrics.renderTime}ms</span>
            <span>📡 {metrics.apiCalls} API calls</span>
            {metrics.memory > 0 && <span>💾 {metrics.memory}MB</span>}
            <span className="text-gray-500">Route: {pathname}</span>
          </div>
        </div>
        <span className="text-gray-400">{isOpen ? '▼' : '▲'}</span>
      </div>

      {/* Detailed info */}
      {isOpen && (
        <div className="border-t border-gray-700 p-4 max-h-96 overflow-y-auto">
          <div className="mb-3 text-xs text-gray-400">
            Current Route: <span className="text-blue-400 font-mono">{pathname}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Render time */}
            <div className="bg-gray-800 p-3 rounded">
              <div className="text-xs text-gray-400 mb-1">Route Render</div>
              <div className="text-2xl font-bold text-green-400">{metrics.renderTime}ms</div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.renderTime === 0 ? '⏳ Loading...' : metrics.renderTime < 100 ? '✅ Fast' : metrics.renderTime < 300 ? '⚠️ Slow' : '❌ Very slow'}
              </div>
            </div>

            {/* API calls */}
            <div className="bg-gray-800 p-3 rounded">
              <div className="text-xs text-gray-400 mb-1">API Calls (this route)</div>
              <div className="text-2xl font-bold text-purple-400">{metrics.apiCalls}</div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.apiCalls === 0 ? '✅ Cached / None' : metrics.apiCalls <= 2 ? '✅ Good' : metrics.apiCalls <= 5 ? '⚠️ Many' : '❌ Too many'}
              </div>
            </div>

            {/* Memory */}
            {metrics.memory > 0 && (
              <div className="bg-gray-800 p-3 rounded">
                <div className="text-xs text-gray-400 mb-1">JS Memory</div>
                <div className="text-2xl font-bold text-yellow-400">{metrics.memory}MB</div>
                <div className="text-xs text-gray-500 mt-1">
                  {metrics.memory < 50 ? '✅ Low' : metrics.memory < 100 ? '⚠️ Medium' : '❌ High'}
                </div>
              </div>
            )}
          </div>

          {/* Performance tips */}
          <div className="mt-4 p-3 bg-gray-800 rounded">
            <div className="text-sm font-semibold mb-2">💡 Performance Tips:</div>
            <ul className="text-xs space-y-1 text-gray-300">
              {metrics.renderTime > 300 && (
                <li>• Route rendering is slow - check component complexity</li>
              )}
              {metrics.apiCalls === 0 && metrics.renderTime < 50 && (
                <li>• 🎉 Great! Data loaded from React Query cache (zero API calls)</li>
              )}
              {metrics.apiCalls > 5 && (
                <li>• Too many API calls - React Query should cache this better</li>
              )}
              {metrics.memory > 100 && (
                <li>• High memory usage - check for memory leaks</li>
              )}
            </ul>
          </div>

          {/* Quick links */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => router.refresh()}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
            >
              🔄 Refresh Data
            </button>
            <button
              onClick={() => console.table({ ...metrics, route: pathname })}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs"
            >
              📊 Log Metrics
            </button>
            <button
              onClick={() => {
                console.log('📍 Route:', pathname)
                console.log('📊 Metrics:', metrics)
                console.log('💾 Memory:', (performance as any).memory)
              }}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
            >
              🔍 Debug Info
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
