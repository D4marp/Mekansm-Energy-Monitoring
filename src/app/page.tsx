'use client'

import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer
} from 'recharts'
import { 
  Zap, AlertCircle, Settings, LogOut, Menu, 
  Gauge, Activity
} from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { devicesAPI, consumptionAPI } from '@/lib/apiClient'
import { useMultipleRealTimePolling } from '@/lib/hooks/useRealTimePolling'

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

interface ChartDataPoint {
  time?: string
  month?: string
  ac: number
  lamp: number
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [timeRange, setTimeRange] = useState('24h')
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [energyData, setEnergyData] = useState<ChartDataPoint[]>([])
  const [monthlyData, setMonthlyData] = useState<ChartDataPoint[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Real-time polling for devices and consumption data
  useMultipleRealTimePolling(
    [
      {
        key: 'devices',
        fetch: async () => {
          const devicesData = await devicesAPI.getAll()
          return devicesData
        },
        onSuccess: (devicesData) => {
          setDevices(devicesData)
          if (loading) setLoading(false)
          setError(null)
        },
      },
      {
        key: 'daily-consumption',
        fetch: async () => {
          if (devices.length === 0) return generateMockCharData()
          try {
            const today = new Date().toISOString().split('T')[0]
            const consumptionData = await consumptionAPI.getDaily(devices[0]?.id, today)
            
            if (consumptionData && Array.isArray(consumptionData)) {
              return consumptionData.map((item: any) => ({
                time: item.timestamp?.substring(11, 16) || item.timestamp || '',
                ac: parseFloat(item.power_ac_kw) || 0,
                lamp: parseFloat(item.power_lamp_kw) || 0,
              }))
            }
            return generateMockCharData()
          } catch (err) {
            return generateMockCharData()
          }
        },
        onSuccess: (data) => {
          setEnergyData(data && data.length > 0 ? data : generateMockCharData())
          setLastUpdate(new Date())
        },
      },
      {
        key: 'monthly-consumption',
        fetch: async () => {
          if (devices.length === 0) return generateMockMonthlyData()
          try {
            const currentMonth = new Date().toISOString().slice(0, 7)
            const monthlyConsumption = await consumptionAPI.getMonthly(devices[0]?.id, currentMonth)
            
            if (monthlyConsumption && Array.isArray(monthlyConsumption)) {
              return monthlyConsumption.slice(-6).map((item: any) => ({
                month: item.month || item.date?.substring(0, 7) || '',
                ac: parseFloat(item.energy_ac_kwh) || 0,
                lamp: parseFloat(item.energy_lamp_kwh) || 0,
              }))
            }
            return generateMockMonthlyData()
          } catch (err) {
            return generateMockMonthlyData()
          }
        },
        onSuccess: (data) => {
          setMonthlyData(data && data.length > 0 ? data : generateMockMonthlyData())
          setLastUpdate(new Date())
        },
      },
    ],
    5000, // 5 second interval for dashboard
    true
  )

  // All devices (single meeting room)
  const filteredDevices = devices

  // Calculate KPI values
  const totalPower = filteredDevices.reduce((sum, d) => sum + (parseFloat(String(d.current_power)) || 0), 0).toFixed(2)
  const acDevices = filteredDevices.filter(d => d.device_type === 'AC')
  const lampDevices = filteredDevices.filter(d => d.device_type === 'LAMP')
  
  const acPower = acDevices.reduce((sum, d) => sum + (parseFloat(String(d.current_power)) || 0), 0).toFixed(2)
  const lampPower = lampDevices.reduce((sum, d) => sum + (parseFloat(String(d.current_power)) || 0), 0).toFixed(2)

  // Calculate average efficiency
  const avgAcTemp = acDevices.length > 0 
    ? (acDevices.reduce((sum, d) => sum + (parseFloat(String(d.current_temperature)) || 0), 0) / acDevices.length).toFixed(1)
    : '0'

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
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
          <NavItem icon={<Activity size={20} />} label="Dasbor" active sidebarOpen={sidebarOpen} href="/" />
          <NavItem icon={<Zap size={20} />} label="Perangkat" sidebarOpen={sidebarOpen} href="/devices" />
          <NavItem icon={<Gauge size={20} />} label="Analitik" sidebarOpen={sidebarOpen} href="/analytics" />
          <NavItem icon={<AlertCircle size={20} />} label="Pemberitahuan" sidebarOpen={sidebarOpen} href="/alerts" />
        </nav>

        <div className="px-2 pb-6 space-y-1 border-t border-white/20 pt-4">
          <NavItem icon={<Settings size={20} />} label="Pengaturan" sidebarOpen={sidebarOpen} href="/settings" />
          <NavItem icon={<LogOut size={20} />} label="Keluar" sidebarOpen={sidebarOpen} href="/" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header dengan Filter */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-8 py-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Meeting Room.</h2>
                <p className="text-gray-500 mt-1">Pemantauan Konsumsi Energi Real-time</p>
                {lastUpdate && (
                  <p className="text-xs text-gray-400 mt-2">
                    🔄 Update terakhir: {lastUpdate.toLocaleTimeString('id-ID')}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Daya Saat Ini</p>
                  <p className="text-2xl font-bold text-primary">
                    {totalPower} kW
                  </p>
                  <p className="text-xs text-green-600">↓ 8% vs kemarin</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                  M
                </div>
              </div>
            </div>

            {/* Class Filter & Time Range */}
            <div className="flex items-center space-x-6 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-700">Lokasi:</span>
                <span className="px-3 py-2 rounded-lg font-medium text-sm bg-red-600 text-white">
                  Meeting Room
                </span>
              </div>

              <div className="flex space-x-2 ml-auto">
                {['24h', '7d', '30d'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg font-medium smooth-transition text-sm ${
                      timeRange === range
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard
              title="AC - Daya Saat Ini"
              value={`${acPower} kW`}
              change="+5%"
              icon={<Zap className="text-orange-500" size={20} />}
              bgColor="bg-orange-50"
            />
            <KPICard
              title="Lampu - Daya Saat Ini"
              value={`${lampPower} kW`}
              change="+3%"
              icon={<Zap className="text-blue-500" size={20} />}
              bgColor="bg-blue-50"
            />
            <KPICard
              title="Suhu AC Rata-rata"
              value={`${avgAcTemp}°C`}
              change="+2%"
              icon={<Gauge className="text-green-500" size={20} />}
              bgColor="bg-green-50"
            />
            <KPICard
              title="Total Perangkat Aktif"
              value={`${filteredDevices.filter(d => d.iot_status === 'online').length}`}
              change={`+1%`}
              icon={<Activity className="text-purple-500" size={20} />}
              bgColor="bg-purple-50"
            />
          </div>

          {/* Advanced Analytics Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* AC & Lamp Consumption */}
            <div className="bg-white rounded-xl card-shadow p-6 hover:shadow-xl smooth-transition">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Konsumsi Daya AC & Lampu</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={energyData.length > 0 ? energyData : generateMockCharData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="ac" fill="#DC2626" radius={[4, 4, 0, 0]} name="Daya AC (kW)" />
                  <Bar dataKey="lamp" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Daya Lampu (kW)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Trend */}
            <div className="bg-white rounded-xl card-shadow p-6 hover:shadow-xl smooth-transition">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tren Bulanan</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyData.length > 0 ? monthlyData : generateMockMonthlyData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="ac" stroke="#DC2626" strokeWidth={2} name="AC (kWh)" />
                  <Line type="monotone" dataKey="lamp" stroke="#F59E0B" strokeWidth={2} name="Lampu (kWh)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Device Management */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
            {/* AC & Lamp Devices Table */}
            <div className="bg-white rounded-xl card-shadow p-6 hover:shadow-xl smooth-transition">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Perangkat AC & Lampu</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Lokasi</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Perangkat</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Daya (kW)</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Suhu (°C)</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Device EUI</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDevices.map((device) => (
                      <tr key={device.id} className="border-b border-gray-100 hover:bg-gray-50 smooth-transition">
                        <td className="py-3 px-4 font-medium text-gray-900">{device.location}</td>
                        <td className="py-3 px-4 text-gray-600">{device.device_name}</td>
                        <td className="py-3 px-4 text-gray-900 font-semibold">{(parseFloat(String(device.current_power)) || 0).toFixed(2)} kW</td>
                        <td className="py-3 px-4 text-gray-600">{(parseFloat(String(device.current_temperature)) || 0).toFixed(1)}°C</td>
                        <td className="py-3 px-4 text-gray-600 text-xs font-mono">{device.device_eui}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            device.iot_status === 'online' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {device.iot_status === 'online' ? '● Online' : '○ Offline'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function NavItem({
  icon,
  label,
  active = false,
  sidebarOpen,
  href = '#'
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  sidebarOpen: boolean
  href?: string
}) {
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

function KPICard({
  title,
  value,
  change,
  icon,
  bgColor,
}: {
  title: string
  value: string
  change: string
  icon: React.ReactNode
  bgColor: string
}) {
  return (
    <div className="bg-white rounded-lg card-shadow p-4 hover:shadow-lg smooth-transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-green-600 font-medium mt-2">{change}</p>
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>{icon}</div>
      </div>
    </div>
  )
}

// Helper functions for mock data
function generateMockCharData(): ChartDataPoint[] {
  return [
    { time: '00:00', ac: 15, lamp: 8 },
    { time: '04:00', ac: 12, lamp: 5 },
    { time: '08:00', ac: 22, lamp: 18 },
    { time: '12:00', ac: 28, lamp: 25 },
    { time: '16:00', ac: 26, lamp: 22 },
    { time: '20:00', ac: 32, lamp: 28 },
    { time: '24:00', ac: 24, lamp: 18 },
  ]
}

function generateMockMonthlyData(): ChartDataPoint[] {
  return [
    { month: 'Jan', ac: 450, lamp: 240 },
    { month: 'Feb', ac: 520, lamp: 280 },
    { month: 'Mar', ac: 410, lamp: 220 },
    { month: 'Apr', ac: 490, lamp: 260 },
    { month: 'May', ac: 600, lamp: 320 },
    { month: 'Jun', ac: 710, lamp: 380 },
  ]
}
