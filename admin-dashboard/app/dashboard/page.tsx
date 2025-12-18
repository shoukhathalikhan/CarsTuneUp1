'use client'

import { useEffect, useState } from 'react'
import { Users, Briefcase, DollarSign, CheckCircle, Calendar } from 'lucide-react'
import api from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'
import StatsCard from '@/components/StatsCard'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalEmployees: 0,
    activeSubscriptions: 0,
    completedJobs: 0,
    todayJobs: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/analytics/dashboard')
      setStats(response.data.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to CarsTuneUp Admin Panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={<Users className="w-8 h-8" />}
          color="blue"
        />
        <StatsCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={<Briefcase className="w-8 h-8" />}
          color="green"
        />
        <StatsCard
          title="Active Subscriptions"
          value={stats.activeSubscriptions}
          icon={<CheckCircle className="w-8 h-8" />}
          color="purple"
        />
        <StatsCard
          title="Completed Jobs"
          value={stats.completedJobs}
          icon={<CheckCircle className="w-8 h-8" />}
          color="indigo"
        />
        <StatsCard
          title="Today's Jobs"
          value={stats.todayJobs}
          icon={<Calendar className="w-8 h-8" />}
          color="orange"
        />
        <StatsCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="w-8 h-8" />}
          color="green"
        />
      </div>
    </DashboardLayout>
  )
}
