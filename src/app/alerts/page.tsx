'use client'

import { useState, useEffect } from 'react'
import { Menu, Settings, Bell, AlertCircle, Trash2, Eye, EyeOff, Archive, Clock, AlertTriangle, Zap, Gauge, Activity } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { alertsAPI } from '@/lib/apiClient'

interface Alert {
  id: number
  title: string
  message: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  status: 'unread' | 'read'
  device_id: number
  created_at: string
}

export default function AlertsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load alerts
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const alertsData = await alertsAPI.getAll()
        setAlerts(alertsData)
        setError(null)
      } catch (err) {
        console.error('Error loading alerts:', err)
        setError(err instanceof Error ? err.message : 'Failed to load alerts')
        setAlerts([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredAlerts = alerts.filter(alert => {
    const statusMatch = filterStatus === 'all' || (filterStatus === 'unread' ? alert.status === 'unread' : alert.status === 'read')
    return statusMatch
  })

  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    unread: alerts.filter(a => a.status === 'unread').length,
    resolved: alerts.filter(a => a.status === 'read').length,
  }

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="text-red-500" size={20} />
      case 'medium':
        return <AlertCircle className="text-yellow-500" size={20} />
      case 'low':
        return <Clock className="text-blue-500" size={20} />
      default:
        return <Clock className="text-blue-500" size={20} />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-l-4 border-red-500'
      case 'high':
        return 'bg-orange-100 border-l-4 border-orange-500'
      case 'medium':
        return 'bg-yellow-100 border-l-4 border-yellow-500'
      case 'low':
        return 'bg-blue-100 border-l-4 border-blue-500'
      default:
        return 'bg-blue-100 border-l-4 border-blue-500'
    }
  }

  const handleMarkAsRead = async (alertId: number) => {
    try {
      await alertsAPI.markAsRead(alertId)
      setAlerts(alerts.map(a => 
        a.id === alertId ? { ...a, status: 'read' } : a
      ))
    } catch (err) {
      console.error('Error marking alert as read:', err)
    }
  }

  const handleDelete = async (alertId: number) => {
    try {
      await alertsAPI.delete(alertId)
      setAlerts(alerts.filter(a => a.id !== alertId))
    } catch (err) {
      console.error('Error deleting alert:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat pemberitahuan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-950 text-white transition-all duration-300 flex flex-col shadow-xl`}
      >
        <div className="p-4 flex items-center justify-center">
          {sidebarOpen ? (
            <div className="w-full flex items-center justify-between">
              <Image src="/mekansm-logo.png" alt="Mekansm Logo" width={150} height={45} priority className="h-10 w-auto object-contain" />
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-white/20 rounded-lg flex-shrink-0 ml-2"
              >
                <Menu size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/20 rounded-lg"
            >
              <Menu size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 px-2 space-y-1">
          <NavLink href="/" icon={<Activity size={20} />} label="Dasbor" sidebarOpen={sidebarOpen} />
          <NavLink href="/devices" icon={<Gauge size={20} />} label="Perangkat" sidebarOpen={sidebarOpen} />
          <NavLink href="/analytics" icon={<Zap size={20} />} label="Analitik" sidebarOpen={sidebarOpen} />
          <NavLink href="/alerts" icon={<Bell size={20} />} label="Pemberitahuan" active sidebarOpen={sidebarOpen} />
        </nav>

        <div className="px-2 pb-6 space-y-1 border-t border-white/20 pt-4">
          <NavLink href="/settings" icon={<Settings size={20} />} label="Pengaturan" sidebarOpen={sidebarOpen} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Notifikasi & Peringatan</h2>
              <p className="text-gray-500 mt-1">Pantau dan kelola notifikasi sistem Meeting Room</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Belum Dibaca</p>
                <p className="text-2xl font-bold text-red-600">{stats.unread}</p>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2">
                <Bell size={20} />
                <span>Pengaturan</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center space-x-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            >
              <option value="all">Semua Status</option>
              <option value="unread">Belum Dibaca</option>
              <option value="read">Sudah Dibaca</option>
            </select>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard title="Total Pemberitahuan" value={stats.total} color="bg-blue-100 text-blue-600" />
            <StatCard title="Kritis" value={stats.critical} color="bg-red-100 text-red-600" />
            <StatCard title="Belum Dibaca" value={stats.unread} color="bg-yellow-100 text-yellow-600" />
            <StatCard title="Diselesaikan" value={stats.resolved} color="bg-green-100 text-green-600" />
          </div>

          {/* Alerts List */}
          <div className="space-y-3">
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 rounded-lg p-4">
                <p className="text-red-700">Error: {error}</p>
              </div>
            )}
            {filteredAlerts.length === 0 ? (
              <div className="bg-white rounded-xl card-shadow p-12 text-center">
                <Bell size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Tidak ada pemberitahuan</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`${getSeverityColor(alert.severity)} rounded-lg p-4 hover:shadow-md smooth-transition`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-2 bg-white/50 rounded-lg mt-1">
                        {getAlertIcon(alert.severity)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                          {alert.status === 'unread' && (
                            <span className="inline-block w-2 h-2 bg-red-500 rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="font-medium">Meeting Room</span>
                          <span>{new Date(alert.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button 
                        onClick={() => handleMarkAsRead(alert.id)}
                        className="p-2 hover:bg-white/50 rounded-lg smooth-transition" 
                        title="Mark as read"
                      >
                        {alert.status === 'read' ? (
                          <Eye size={18} className="text-gray-600" />
                        ) : (
                          <EyeOff size={18} className="text-gray-400" />
                        )}
                      </button>
                      <button className="p-2 hover:bg-white/50 rounded-lg smooth-transition" title="Archive">
                        <Archive size={18} className="text-gray-600" />
                      </button>
                      <button 
                        onClick={() => handleDelete(alert.id)}
                        className="p-2 hover:bg-red-200 rounded-lg smooth-transition" 
                        title="Delete"
                      >
                        <Trash2 size={18} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function NavLink({ href, icon, label, active = false, sidebarOpen }: any) {
  return (
    <Link
      href={href}
      title={label}
      className={`w-full flex items-center justify-center px-3 py-3 rounded-lg smooth-transition ${
        active ? 'bg-red-500/20 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-red-400'
      }`}
    >
      <div className="flex items-center space-x-3 w-full">
        <span className={`flex-shrink-0 ${active ? 'text-red-500' : 'text-red-400'}`}>{icon}</span>
        {sidebarOpen && <span className={`text-sm font-medium whitespace-nowrap ${active ? 'text-white' : 'text-gray-300'}`}>{label}</span>}
      </div>
    </Link>
  )
}

function StatCard({ title, value, color }: any) {
  return (
    <div className="bg-white rounded-lg card-shadow p-4">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  )
}
