'use client'

import { useState } from 'react'
import { Power, AlertCircle, Settings, Zap, Gauge, Menu } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { devicesAPI } from '@/lib/apiClient'
import { useRealTimePolling } from '@/lib/hooks/useRealTimePolling'

interface Device {
  id: number
  device_eui: string
  device_name: string
  device_type: string
  application_type: string
  location: string
  current_power: number
  current_temperature: number
  iot_status: string
}

export default function DevicesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Real-time polling - refresh devices every 5 seconds
  useRealTimePolling(
    async () => {
      const devicesData = await devicesAPI.getAll()
      return devicesData
    },
    (devicesData) => {
      setDevices(devicesData)
      setLastUpdate(new Date())
      setError(null)
      if (loading) setLoading(false)
    },
    5000, // 5 second interval
    true
  )

  const filteredDevices = devices

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data perangkat...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center bg-white p-6 rounded-lg shadow">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={32} />
          <p className="text-red-600 font-semibold">Error: {error}</p>
          <p className="text-gray-600 mt-2 text-sm">Silakan coba muat ulang halaman</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-950 text-white transition-all duration-300 flex flex-col shadow-xl`}>
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
          <NavLink href="/" icon={<Zap size={20} />} label="Dasbor" sidebarOpen={sidebarOpen} />
          <NavLink href="/devices" icon={<Gauge size={20} />} label="Perangkat" active sidebarOpen={sidebarOpen} />
          <NavLink href="/analytics" icon={<Power size={20} />} label="Analitik" sidebarOpen={sidebarOpen} />
          <NavLink href="/alerts" icon={<AlertCircle size={20} />} label="Pemberitahuan" sidebarOpen={sidebarOpen} />
        </nav>

        <div className="px-2 pb-6 space-y-1 border-t border-white/20 pt-4">
          <NavLink href="/settings" icon={<Settings size={20} />} label="Pengaturan" sidebarOpen={sidebarOpen} />
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-8 py-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Perangkat.</h2>
                <p className="text-gray-500 mt-1">Status dan Monitoring Perangkat Meeting Room</p>
                {lastUpdate && (
                  <p className="text-xs text-gray-400 mt-2">
                    🔄 Update terakhir: {lastUpdate.toLocaleTimeString('id-ID')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-700">Lokasi:</span>
              <span className="px-3 py-2 rounded-lg font-medium text-sm bg-red-600 text-white">
                Meeting Room
              </span>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="grid grid-cols-1 gap-6">
            {filteredDevices.length > 0 ? (
              filteredDevices.map((device) => (
                <div key={device.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-sm text-gray-500">{device.location}</p>
                          <h3 className="text-lg font-bold text-gray-900 mt-1">{device.device_name}</h3>
                          <p className="text-xs text-gray-400 font-mono mt-1">{device.device_eui}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${device.iot_status === 'online' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {device.iot_status === 'online' ? '● Online' : '○ Offline'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Daya</span>
                          <span className="font-semibold">{(parseFloat(String(device.current_power)) || 0).toFixed(2)} kW</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Suhu</span>
                          <span className="font-semibold">{(parseFloat(String(device.current_temperature)) || 0).toFixed(1)}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tipe</span>
                          <span className="font-semibold text-blue-600">{device.device_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Aplikasi</span>
                          <span className="font-semibold text-green-600">{device.application_type}</span>
                        </div>
                      </div>
                    </div>

                    <div></div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-4">Info Perangkat</h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-gray-500">Status IoT</p>
                          <p className="font-medium text-gray-900">{device.iot_status}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Jenis Perangkat</p>
                          <p className="font-medium text-gray-900">{device.device_type}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">EUI Perangkat</p>
                          <p className="font-medium text-gray-900 font-mono text-xs">{device.device_eui}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Tidak ada perangkat ditemukan</p>
              </div>
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
