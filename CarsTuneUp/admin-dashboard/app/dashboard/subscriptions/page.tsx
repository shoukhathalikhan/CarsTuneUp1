'use client'

import { useEffect, useState } from 'react'
import { Calendar, User, IndianRupee, CheckCircle, XCircle } from 'lucide-react'
import api from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'

interface Subscription {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
    phone: string
  }
  serviceId: {
    _id: string
    name: string
    price: number
    frequency: string
  }
  startDate: string
  endDate: string
  nextWashDate: string
  status: string
  amount: number
  paymentStatus: string
  assignedEmployee?: {
    _id: string
    employeeId: string
    userId: {
      _id: string
      name: string
      email: string
    }
  }
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get('/subscriptions')
      setSubscriptions(response.data.data.subscriptions)
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      alert('Failed to fetch subscriptions')
    } finally {
      setLoading(false)
    }
  }

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (filter === 'all') return true
    return sub.status === filter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
        <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-gray-600 mt-2">Manage customer subscriptions</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex space-x-2 border-b border-gray-200">
        {['all', 'active', 'cancelled', 'expired'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 font-medium capitalize transition ${
              filter === status
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {status} ({subscriptions.filter(s => status === 'all' || s.status === status).length})
          </button>
        ))}
      </div>

      {/* Subscriptions Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredSubscriptions.map((subscription) => (
          <div key={subscription._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {subscription.serviceId.name}
                  </h3>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(subscription.status)}`}>
                    {subscription.status}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{subscription.userId.name}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm">{subscription.userId.email}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm">{subscription.userId.phone}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end space-x-2 text-2xl font-bold text-primary mb-1">
                  <IndianRupee className="w-6 h-6" />
                  <span>{subscription.amount}</span>
                </div>
                <span className="text-sm text-gray-500 capitalize">
                  {subscription.serviceId.frequency}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600">Start Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(subscription.startDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-600">End Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(subscription.endDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-600">Next Wash</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(subscription.nextWashDate)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                {subscription.assignedEmployee && subscription.assignedEmployee.userId ? (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Assigned to: <strong>{subscription.assignedEmployee.userId.name}</strong></span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <XCircle className="w-4 h-4" />
                    <span>No employee assigned</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  subscription.paymentStatus === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  Payment: {subscription.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSubscriptions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No subscriptions found for this filter.</p>
        </div>
      )}
    </DashboardLayout>
  )
}
