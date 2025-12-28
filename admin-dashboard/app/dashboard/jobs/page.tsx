'use client'

import { useEffect, useState } from 'react'
import { Calendar, User, MapPin, CheckCircle } from 'lucide-react'
import api from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'

interface Job {
  _id: string
  subscriptionId: {
    userId: {
      name: string
      phone: string
      area?: string
    }
    serviceId: {
      name: string
    }
  }
  employeeId: {
    employeeId: string
    userId: {
      name: string
      email: string
    }
  }
  scheduledDate: string
  status: string
  completedAt?: string
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs')
      setJobs(response.data.data.jobs || [])
    } catch (error) {
      console.error('Error fetching jobs:', error)
      alert('Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true
    return job.status === filter
  })

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
        <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
        <p className="text-gray-600 mt-2">Manage all service jobs</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex space-x-2 border-b border-gray-200">
        {['all', 'scheduled', 'in-progress', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 font-medium capitalize transition ${
              filter === status
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {status} ({jobs.filter(j => status === 'all' || j.status === status).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredJobs.map((job) => (
          <div key={job._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {job.subscriptionId?.serviceId?.name || 'Service'}
                </h3>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    <span>{job.subscriptionId?.userId?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{job.subscriptionId?.userId?.area || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(job.scheduledDate)}</span>
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                {job.status}
              </span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                <span>Assigned to: <strong>{job.employeeId?.userId?.name || 'Unassigned'}</strong></span>
              </div>
              {job.completedAt && (
                <div className="text-sm text-gray-500">
                  Completed: {formatDate(job.completedAt)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No jobs found for this filter.</p>
        </div>
      )}
    </DashboardLayout>
  )
}
