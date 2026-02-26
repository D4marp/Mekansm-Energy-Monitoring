'use client'

import { useState } from 'react'
import { Menu, Settings, TrendingUp, Gauge, Zap, AlertCircle } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
import Image from 'next/image'
import { devicesAPI, consumptionAPI } from '@/lib/apiClient'
import { useMultipleRealTimePolling } from '@/lib/hooks/useRealTimePolling'

interface Device {
  id: number
  location: string
  device_name: string
  current_power: number
  current_temperature: number
}

export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [_error, setError] = useState<string | null>(null)
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [dailyTrends, setDailyTrends] = useState<any[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Monthly AC & Lamp Data
  const defaultMonthlyData = [
    { month: 'Jan', ac: 450, lamp: 240, acEff: 88, lampEff: 91 },
    { month: 'Feb', ac: 520, lamp: 280, acEff: 89, lampEff: 92 },
    { month: 'Mar', ac: 410, lamp: 220, acEff: 90, lampEff: 93 },
    { month: 'Apr', ac: 490, lamp: 260, acEff: 91, lampEff: 94 },
    { month: 'May', ac: 600, lamp: 320, acEff: 92, lampEff: 95 },
    { month: 'Jun', ac: 710, lamp: 380, acEff: 91, lampEff: 93 },
  ]

  // Daily Peak Usage
  const defaultDailyTrends = [
    { day: 'Sen', ac: 2.5, lamp: 1.2 },
    { day: 'Sel', ac: 2.8, lamp: 1.4 },
    { day: 'Rab', ac: 2.2, lamp: 1.1 },
    { day: 'Kam', ac: 3.0, lamp: 1.5 },
    { day: 'Jum', ac: 3.2, lamp: 1.6 },
    { day: 'Sab', ac: 1.8, lamp: 0.9 },
    { day: 'Min', ac: 1.5, lamp: 0.8 },
  ]

  // Class Comparison (computed from devices)
  const deviceComparison = devices.length > 0 
    ? devices.map(d => ({
        device: d.location || 'Unknown',
        efficiency: Math.random() * 10 + 85,
        consumption: d.current_power || 0,
        cost: (d.current_power || 0) * 1.2
      }))
    : [
        { device: 'Meeting Room', efficiency: 91, consumption: 4.2, cost: 5.0 },
      ]

  // Hourly pattern (mock data)
  const hourlyPattern = [
    { hour: '00', load: 35, renewable: 2 },
    { hour: '04', load: 28, renewable: 1 },
    { hour: '08', load: 52, renewable: 15 },
    { hour: '12', load: 75, renewable: 45 },
    { hour: '16', load: 68, renewable: 52 },
    { hour: '20', load: 88, renewable: 25 },
    { hour: '24', load: 55, renewable: 5 },
  ]

  // Cost breakdown (mock data)
  const costBreakdown = [
    { category: 'Jam Sibuk', cost: 120, percentage: 50 },
    { category: 'Jam Normal', cost: 80, percentage: 33 },
    { category: 'Jam Hemat', cost: 40, percentage: 17 },
  ]

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
        key: 'monthly',
        fetch: async () => {
          if (devices.length === 0) return defaultMonthlyData
          try {
            const currentMonth = new Date().toISOString().slice(0, 7)
            const monthlyConsumption = await consumptionAPI.getMonthly(devices[0]?.id, currentMonth)
            if (monthlyConsumption && Array.isArray(monthlyConsumption)) {
              return monthlyConsumption.slice(-6).map((item: any) => ({
                month: item.month || item.date?.substring(0, 7) || '',
                ac: parseFloat(item.energy_ac_kwh) || 0,
                lamp: parseFloat(item.energy_lamp_kwh) || 0,
                acEff: 89 + Math.random() * 5,
                lampEff: 91 + Math.random() * 4,
              }))
            }
            return defaultMonthlyData
          } catch {
            return defaultMonthlyData
          }
        },
        onSuccess: (data) => {
          setMonthlyData(data && data.length > 0 ? data : defaultMonthlyData)
          setLastUpdate(new Date())
        },
      },
      {
        key: 'daily',
        fetch: async () => {
          if (devices.length === 0) return defaultDailyTrends
          try {
            const today = new Date().toISOString().split('T')[0]
            const dailyConsumption = await consumptionAPI.getDaily(devices[0]?.id, today)
            if (dailyConsumption && Array.isArray(dailyConsumption)) {
              return dailyConsumption.map((item: any, idx: number) => ({
                day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx % 7],
                ac: parseFloat(item.power_ac_kw) || 0,
                lamp: parseFloat(item.power_lamp_kw) || 0,
              }))
            }
            return defaultDailyTrends
          } catch {
            return defaultDailyTrends
          }
        },
        onSuccess: (data) => {
          setDailyTrends(data && data.length > 0 ? data : defaultDailyTrends)
          setLastUpdate(new Date())
        },
      },
    ],
    10000, // 10 second interval
    true
  )

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data analitik...</p>
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
          <NavLink href="/" icon={<Zap size={20} />} label="Dasbor" sidebarOpen={sidebarOpen} />
          <NavLink href="/devices" icon={<Gauge size={20} />} label="Perangkat" sidebarOpen={sidebarOpen} />
          <NavLink href="/analytics" icon={<TrendingUp size={20} />} label="Analitik" active sidebarOpen={sidebarOpen} />
          <NavLink href="/alerts" icon={<AlertCircle size={20} />} label="Pemberitahuan" sidebarOpen={sidebarOpen} />
        </nav>

        <div className="px-2 pb-6 space-y-1 border-t border-white/20 pt-4">
          <NavLink href="/settings" icon={<Settings size={20} />} label="Pengaturan" sidebarOpen={sidebarOpen} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-8 py-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Analitik AC & Lampu</h2>
                <p className="text-gray-500 mt-1">Analisis Konsumsi Energi Terperinci - Meeting Room</p>
                {lastUpdate && (
                  <p className="text-xs text-gray-400 mt-2">
                    🔄 Update terakhir: {lastUpdate.toLocaleTimeString('id-ID')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-6 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-700">Lokasi:</span>
                <span className="px-3 py-2 rounded-lg font-medium text-sm bg-red-600 text-white">
                  Meeting Room
                </span>
              </div>

              <div className="flex space-x-2 ml-auto">
                {['7d', '30d', '90d'].map((range) => (
                  <button key={range} onClick={() => setTimeRange(range)} className={`px-4 py-2 rounded-lg font-medium smooth-transition text-sm ${timeRange === range ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <AnalyticsCard
              title="AC Konsumsi"
              value="450 kWh"
              change="+8.5%"
              icon={<Zap className="text-orange-500" />}
            />
            <AnalyticsCard
              title="Lampu Konsumsi"
              value="240 kWh"
              change="+5.2%"
              icon={<Gauge className="text-blue-500" />}
            />
            <AnalyticsCard
              title="AC Efisiensi"
              value="91%"
              change="+2%"
              icon={<TrendingUp className="text-green-500" />}
            />
            <AnalyticsCard
              title="Lampu Efisiensi"
              value="93%"
              change="+1%"
              icon={<TrendingUp className="text-teal-500" />}
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Monthly Trend */}
            <div className="bg-white rounded-xl card-shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tren Konsumsi Bulanan</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="ac" stroke="#DC2626" strokeWidth={2} name="AC (kWh)" />
                  <Line type="monotone" dataKey="lamp" stroke="#F59E0B" strokeWidth={2} name="Lampu (kWh)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Daily Patterns */}
            <div className="bg-white rounded-xl card-shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Puncak Penggunaan Harian</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="ac" fill="#DC2626" name="AC Peak (kW)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lamp" fill="#F59E0B" name="Lamp Peak (kW)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Device Efficiency */}
            <div className="bg-white rounded-xl card-shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analisis Efisiensi Perangkat</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deviceComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" />
                  <YAxis dataKey="device" type="category" stroke="#6b7280" width={80} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="efficiency" fill="#10B981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Hourly Pattern */}
            <div className="bg-white rounded-xl card-shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Beban Per Jam vs Terbarukan</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hourlyPattern}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" yAxisId="left" />
                  <YAxis stroke="#6b7280" yAxisId="right" orientation="right" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="load" stroke="#0F766E" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="renewable" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Consumers */}
            <div className="bg-white rounded-xl card-shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Konsumen Energi Teratas</h3>
              <div className="space-y-3">
                {deviceComparison
                  .sort((a, b) => b.consumption - a.consumption)
                  .map((device, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{device.device}</p>
                        <p className="text-sm text-gray-500">{device.consumption} kWh hari ini</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">Rp {(device.cost * 1000).toLocaleString('id-ID')}</p>
                        <p className="text-sm text-gray-500">{device.efficiency}% efisien</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white rounded-xl card-shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analisis Rincian Biaya</h3>
              <div className="space-y-4">
                {costBreakdown.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-900">{item.category}</span>
                      <span className="text-sm font-semibold text-gray-700">Rp {(item.cost * 1000).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-600 to-amber-500" style={{ width: `${item.percentage}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.percentage}% dari total</p>
                  </div>
                ))}
              </div>
            </div>
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

function AnalyticsCard({ title, value, change, icon }: any) {
  return (
    <div className="bg-white rounded-lg card-shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-green-600 font-medium mt-2">{change}</p>
        </div>
        <div className="p-3 bg-gray-100 rounded-lg">{icon}</div>
      </div>
    </div>
  )
}
