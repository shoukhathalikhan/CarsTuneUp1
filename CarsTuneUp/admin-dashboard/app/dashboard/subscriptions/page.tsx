'use client'

import { useEffect, useState } from 'react'
import { Calendar, User, IndianRupee, CheckCircle, XCircle, Edit2, Save, X } from 'lucide-react'
import api from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'
import toast from 'react-hot-toast'

interface Employee {
  _id: string
  employeeId: string
  userId: {
    _id: string
    name: string
    email: string
    phone: string
  }
}

interface Subscription {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
    phone: string
    address?: string
  }
  serviceId: {
    _id: string
    name: string
    price: number
    frequency: string
  }
  startDate: string | null
  endDate: string
  nextWashDate: string | null
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
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ employeeId: string; startDate: string }>({ employeeId: '', startDate: '' })
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [subsResponse, empResponse] = await Promise.all([
        api.get('/subscriptions'),
        api.get('/employees')
      ])
      setSubscriptions(subsResponse.data.data.subscriptions)
      setEmployees(empResponse.data.data.employees || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignEmployee = async (subscriptionId: string) => {
    if (!editData.employeeId || !editData.startDate) {
      toast.error('Please select both employee and start date')
      return
    }

    setAssigning(true)
    try {
      await api.put(`/subscriptions/${subscriptionId}/assign-employee`, {
        employeeId: editData.employeeId,
        startDate: editData.startDate
      })
      toast.success('Employee assigned and schedules generated successfully')
      setEditingId(null)
      setEditData({ employeeId: '', startDate: '' })
      await fetchData()
    } catch (error: any) {
      console.error('Error assigning employee:', error)
      toast.error(error.response?.data?.message || 'Failed to assign employee')
    } finally {
      setAssigning(false)
    }
  }

  const startEditing = (subscription: Subscription) => {
    setEditingId(subscription._id)
    setEditData({
      employeeId: subscription.assignedEmployee?._id || '',
      startDate: subscription.startDate || new Date().toISOString().split('T')[0]
    })
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
      <div className="mb-6 flex space-x-2 border-b border-gray-200 overflow-x-auto">
        {['all', 'pending', 'active', 'cancelled', 'expired'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 font-medium capitalize transition whitespace-nowrap ${
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
          <div key={subscription._id} className={`bg-white rounded-lg shadow-md p-6 ${subscription.status === 'pending' ? 'border-2 border-yellow-300' : ''}`}>
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

            {editingId === subscription._id ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-3">Assign Employee & Set Start Date</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee</label>
                    <select
                      value={editData.employeeId}
                      onChange={(e) => setEditData({ ...editData, employeeId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Choose an employee...</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.userId.name} ({emp.userId.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Start Date</label>
                    <input
                      type="date"
                      value={editData.startDate}
                      onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAssignEmployee(subscription._id)}
                    disabled={assigning}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {assigning ? 'Assigning...' : 'Confirm & Generate Schedules'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Start Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {subscription.startDate ? formatDate(subscription.startDate) : 'Not set'}
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
                      {subscription.nextWashDate ? formatDate(subscription.nextWashDate) : 'Not scheduled'}
                    </p>
                  </div>
                </div>
              </div>
            )}

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

              <div className="flex items-center space-x-2 gap-2">
                {subscription.status === 'pending' && editingId !== subscription._id && (
                  <button
                    onClick={() => startEditing(subscription)}
                    className="flex items-center gap-2 px-3 py-1 bg-primary text-white text-sm rounded-lg hover:bg-primary/90"
                  >
                    <Edit2 className="w-4 h-4" />
                    Assign
                  </button>
                )}
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
