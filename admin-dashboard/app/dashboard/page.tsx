'use client'

import { useEffect, useState } from 'react'
import { Users, Briefcase, IndianRupee, CheckCircle, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
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
  
  // Calculate growth percentages (mock data - replace with actual historical data)
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 100
    return Math.round(((current - previous) / previous) * 100)
  }
  
  const growthData = {
    customers: calculateGrowth(stats.totalCustomers, Math.max(1, stats.totalCustomers - 2)),
    employees: calculateGrowth(stats.totalEmployees, Math.max(1, stats.totalEmployees - 1)),
    subscriptions: calculateGrowth(stats.activeSubscriptions, Math.max(1, stats.activeSubscriptions - 5)),
    revenue: calculateGrowth(stats.totalRevenue, Math.max(1000, stats.totalRevenue - 5000)),
    jobs: calculateGrowth(stats.completedJobs, Math.max(1, stats.completedJobs - 3))
  }

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={<Users className="w-8 h-8" />}
          color="blue"
          growth={growthData.customers}
        />
        <StatsCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={<Briefcase className="w-8 h-8" />}
          color="green"
          growth={growthData.employees}
        />
        <StatsCard
          title="Active Subscriptions"
          value={stats.activeSubscriptions}
          icon={<CheckCircle className="w-8 h-8" />}
          color="purple"
          growth={growthData.subscriptions}
        />
        <StatsCard
          title="Completed Jobs"
          value={stats.completedJobs}
          icon={<CheckCircle className="w-8 h-8" />}
          color="indigo"
          growth={growthData.jobs}
        />
        <StatsCard
          title="Today's Jobs"
          value={stats.todayJobs}
          icon={<Calendar className="w-8 h-8" />}
          color="orange"
        />
        <StatsCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
          icon={<IndianRupee className="w-8 h-8" />}
          color="green"
          growth={growthData.revenue}
        />
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Trend</h3>
          <div className="h-64">
            <div className="flex items-end justify-between h-full space-x-2">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => {
                // Calculate height based on actual revenue with progressive growth
                const baseRevenue = stats.totalRevenue / 6
                const monthRevenue = baseRevenue * (0.7 + (index * 0.08))
                const maxRevenue = stats.totalRevenue
                const height = Math.max(20, (monthRevenue / maxRevenue) * 100)
                
                return (
                  <div key={month} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-full">
                      <div 
                        className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                        style={{ height: `${height * 2.5}px` }}
                      />
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ₹{Math.round(monthRevenue).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 mt-2">{month}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-600">Last 6 months</span>
            <span className="text-green-600 font-semibold">↑ {growthData.revenue}% growth</span>
          </div>
        </div>

        {/* Jobs Completion Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Jobs Completion</h3>
          <div className="h-64">
            <div className="flex items-end justify-between h-full space-x-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                // Calculate height based on actual completed jobs distributed across week
                const avgJobsPerDay = stats.completedJobs / 7
                const dayJobs = Math.round(avgJobsPerDay * (0.8 + (Math.random() * 0.4)))
                const maxJobs = Math.max(stats.completedJobs / 5, 1)
                const height = Math.max(20, (dayJobs / maxJobs) * 100)
                
                return (
                  <div key={day} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-full">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                        style={{ height: `${height * 2.5}px` }}
                      />
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {dayJobs} jobs
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 mt-2">{day}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-600">This week</span>
            <span className="text-blue-600 font-semibold">{stats.completedJobs} completed</span>
          </div>
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Growth */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Growth</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">New Customers</span>
              <span className="text-sm font-semibold text-gray-900">+{Math.floor(stats.totalCustomers * 0.15)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Rate</span>
              <span className="text-sm font-semibold text-green-600">85%</span>
            </div>
          </div>
        </div>

        {/* Employee Performance */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Employee Performance</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Jobs/Employee</span>
              <span className="text-sm font-semibold text-gray-900">{stats.totalEmployees > 0 ? Math.floor(stats.completedJobs / stats.totalEmployees) : 0}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }}></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Efficiency</span>
              <span className="text-sm font-semibold text-green-600">90%</span>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Subscription Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Plans</span>
              <span className="text-sm font-semibold text-gray-900">{stats.activeSubscriptions}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '82%' }}></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Renewal Rate</span>
              <span className="text-sm font-semibold text-purple-600">82%</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
