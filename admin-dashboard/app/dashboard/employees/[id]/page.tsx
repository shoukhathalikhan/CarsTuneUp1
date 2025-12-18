'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, Mail, Phone, MapPin, Calendar, Star, 
  Briefcase, CheckCircle, Clock, User, Package 
} from 'lucide-react'
import api from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'

interface Employee {
  _id: string
  employeeId: string
  userId: {
    _id: string
    name: string
    email: string
    phone: string
    profileImage?: string
  }
  area: string
  isAvailable: boolean
  assignedJobsToday: number
  totalJobsCompleted: number
  rating: number
  createdAt: string
  assignedCustomers: string[]
  maxCustomers: number
  dailyJobLimit: number
}

interface Job {
  _id: string
  customerId: {
    _id: string
    name: string
    email: string
    phone: string
    address?: string
  }
  serviceId: {
    _id: string
    name: string
    frequency: string
  }
  scheduledDate: string
  status: string
  completedDate?: string
  startTime?: string
  endTime?: string
}

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const employeeId = params.id as string

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [allJobs, setAllJobs] = useState<Job[]>([])
  const [todayJobs, setTodayJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'completed'>('today')

  useEffect(() => {
    fetchEmployeeDetails()
  }, [employeeId])

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true)
      
      const [employeeRes, jobsRes] = await Promise.all([
        api.get(`/employees/${employeeId}`),
        api.get(`/jobs?employeeId=${employeeId}`)
      ])

      setEmployee(employeeRes.data.data.employee)
      const jobs = jobsRes.data.data.jobs || []
      setAllJobs(jobs)

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const todayJobsList = jobs.filter((job: Job) => {
        const jobDate = new Date(job.scheduledDate)
        return jobDate >= today && jobDate < tomorrow
      })
      setTodayJobs(todayJobsList)
    } catch (error) {
      console.error('Error fetching employee details:', error)
      alert('Failed to fetch employee details')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredJobs = () => {
    switch (activeTab) {
      case 'today':
        return todayJobs
      case 'completed':
        return allJobs.filter(job => job.status === 'completed')
      case 'all':
      default:
        return allJobs
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

  if (!employee) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Employee not found</p>
          <button
            onClick={() => router.push('/dashboard/employees')}
            className="mt-4 text-primary hover:underline"
          >
            Back to Employees
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const completedJobs = allJobs.filter(job => job.status === 'completed')
  const scheduledJobs = allJobs.filter(job => job.status === 'scheduled')
  const inProgressJobs = allJobs.filter(job => job.status === 'in-progress')

  return (
    <DashboardLayout>
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/employees')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Employees
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Employee Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
              {employee.userId?.name?.charAt(0).toUpperCase() || 'E'}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{employee.userId?.name}</h2>
            <p className="text-sm text-gray-500 font-mono mb-4">{employee.employeeId}</p>
            
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-6 ${
              employee.isAvailable 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {employee.isAvailable ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Active
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Inactive
                </>
              )}
            </div>

            <div className="w-full space-y-3">
              <div className="flex items-center text-gray-700">
                <Mail className="w-5 h-5 mr-3 text-gray-400" />
                <span className="text-sm">{employee.userId?.email}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Phone className="w-5 h-5 mr-3 text-gray-400" />
                <span className="text-sm">{employee.userId?.phone}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <MapPin className="w-5 h-5 mr-3 text-gray-400" />
                <span className="text-sm">{employee.area}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                <span className="text-sm">Joined {formatDate(employee.createdAt)}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Star className="w-5 h-5 mr-3 text-yellow-400" />
                <span className="text-sm font-medium">{employee.rating.toFixed(1)} Rating</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Today's Jobs</h3>
              <Briefcase className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{todayJobs.length}</p>
            <p className="text-xs text-gray-500 mt-1">
              Limit: {employee.dailyJobLimit || 6} per day
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Completed</h3>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{employee.totalJobsCompleted}</p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Assigned Customers</h3>
              <User className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{employee.assignedCustomers?.length || 0}</p>
            <p className="text-xs text-gray-500 mt-1">
              Max: {employee.maxCustomers || 6} customers
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{inProgressJobs.length}</p>
            <p className="text-xs text-gray-500 mt-1">Active jobs</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('today')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'today'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Today's Jobs ({todayJobs.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'all'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Jobs ({allJobs.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'completed'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Completed ({completedJobs.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredJobs().length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No jobs found in this category
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredJobs().map((job) => (
                  <tr key={job._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {job.customerId?.name || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {job.customerId?.phone || 'N/A'}
                        </div>
                        {job.customerId?.address && (
                          <div className="text-xs text-gray-400 mt-1">
                            {job.customerId.address}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-2 text-gray-400" />
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900">{job.serviceId?.name || 'N/A'}</span>
                          <span className="text-xs text-gray-500 capitalize">
                            {job.serviceId?.frequency || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDateTime(job.scheduledDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {job.completedDate ? formatDate(job.completedDate) : '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
