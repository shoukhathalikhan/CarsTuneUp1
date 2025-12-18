'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react'
import api from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'

interface Service {
  _id: string
  name: string
  description: string
  price: number
  frequency: string
  duration: number
  imageURL: string | null
  features: string[]
  isActive: boolean
  category: string
  vehicleType?: 'hatchback-sedan' | 'suv-muv'
}

interface Addon {
  _id: string
  name: string
  price: number
  imageURL?: string | null
  description?: string
}

const vehicleTypeOptions = [
  { value: 'hatchback-sedan', label: 'Hatchback / Sedan' },
  { value: 'suv-muv', label: 'SUV / MUV' }
]

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: '2-days-once', label: '2 Days Once' },
  { value: '3-days-once', label: '3 Days Once' },
  { value: 'weekly-once', label: 'Weekly Once' },
  { value: 'one-time', label: 'One Time' }
]

const allowedFrequencies = frequencyOptions.map((option) => option.value)
const allowedVehicleTypes = vehicleTypeOptions.map((option) => option.value)

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    frequency: frequencyOptions[0].value,
    duration: '30',
    features: '',
    isActive: true,
    category: 'basic',
    vehicleType: 'hatchback-sedan'
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  const [addons, setAddons] = useState<Addon[]>([])
  const [showAddonModal, setShowAddonModal] = useState(false)
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null)
  const [addonFormData, setAddonFormData] = useState({
    name: '',
    price: '',
    description: ''
  })
  const [addonImageFile, setAddonImageFile] = useState<File | null>(null)
  const [addonSubmitting, setAddonSubmitting] = useState(false)

  useEffect(() => {
    fetchServices()
    fetchAddons()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await api.get('/services')
      setServices(response.data.data.services)
    } catch (error) {
      console.error('Error fetching services:', error)
      alert('Failed to fetch services')
    } finally {
      setLoading(false)
    }
  }

  const fetchAddons = async () => {
    try {
      const response = await api.get('/addons')
      setAddons(response.data.data.addons)
    } catch (error) {
      console.error('Error fetching addons:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const data = new FormData()
      data.append('name', formData.name)
      data.append('description', formData.description)
      data.append('price', formData.price)
      const safeFrequency = allowedFrequencies.includes(formData.frequency)
        ? formData.frequency
        : frequencyOptions[0].value
      data.append('frequency', safeFrequency)
      data.append('duration', formData.duration)
      data.append('features', JSON.stringify(formData.features.split('\n').filter(f => f.trim())))
      data.append('isActive', String(formData.isActive))
      data.append('category', formData.category)
      const safeVehicleType = allowedVehicleTypes.includes(formData.vehicleType)
        ? formData.vehicleType
        : vehicleTypeOptions[0].value
      data.append('vehicleType', safeVehicleType)
      
      if (imageFile) {
        data.append('serviceImage', imageFile)
      }

      if (editingService) {
        await api.put(`/services/${editingService._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        alert('Service updated successfully!')
      } else {
        await api.post('/services', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        alert('Service created successfully!')
      }

      setShowModal(false)
      resetForm()
      fetchServices()
    } catch (error: any) {
      console.error('Error saving service:', error)
      alert(error.response?.data?.message || 'Failed to save service')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description,
      price: String(service.price),
      frequency: allowedFrequencies.includes(service.frequency)
        ? service.frequency
        : frequencyOptions[0].value,
      duration: String(service.duration),
      features: service.features.join('\n'),
      isActive: service.isActive,
      category: service.category,
      vehicleType: allowedVehicleTypes.includes(service.vehicleType || '')
        ? (service.vehicleType as 'hatchback-sedan' | 'suv-muv')
        : 'hatchback-sedan'
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      await api.delete(`/services/${id}`)
      alert('Service deleted successfully!')
      fetchServices()
    } catch (error) {
      console.error('Error deleting service:', error)
      alert('Failed to delete service')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      frequency: frequencyOptions[0].value,
      duration: '30',
      features: '',
      isActive: true,
      category: 'basic',
      vehicleType: 'hatchback-sedan'
    })
    setImageFile(null)
    setEditingService(null)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    resetForm()
  }

  const handleAddAddon = () => {
    setEditingAddon(null)
    setAddonFormData({ name: '', price: '', description: '' })
    setShowAddonModal(true)
  }

  const handleEditAddon = (addon: Addon) => {
    setEditingAddon(addon)
    setAddonFormData({ 
      name: addon.name, 
      price: String(addon.price),
      description: addon.description || ''
    })
    setShowAddonModal(true)
  }

  const handleDeleteAddon = async (addonId: string) => {
    if (!confirm('Are you sure you want to delete this addon?')) return
    
    try {
      await api.delete(`/addons/${addonId}`)
      alert('Addon deleted successfully!')
      fetchAddons()
    } catch (error) {
      console.error('Error deleting addon:', error)
      alert('Failed to delete addon')
    }
  }

  const handleAddonSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddonSubmitting(true)
    
    try {
      const data = new FormData()
      data.append('name', addonFormData.name)
      data.append('price', String(addonFormData.price))
      data.append('description', addonFormData.description)
      
      if (addonImageFile) {
        data.append('addonImage', addonImageFile)
      }

      if (editingAddon) {
        await api.put(`/addons/${editingAddon._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        alert('Addon updated successfully!')
      } else {
        await api.post('/addons', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        alert('Addon added successfully!')
      }
      
      setShowAddonModal(false)
      setAddonFormData({ name: '', price: '', description: '' })
      setAddonImageFile(null)
      setEditingAddon(null)
      fetchAddons()
    } catch (error: any) {
      console.error('Error saving addon:', error)
      alert(error.response?.data?.message || 'Failed to save addon')
    } finally {
      setAddonSubmitting(false)
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-2">Manage your car wash services</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Add Service</span>
        </button>
      </div>

      {vehicleTypeOptions.map((group) => {
        const groupServices = services.filter((service) => (service.vehicleType || 'hatchback-sedan') === group.value)
        return (
          <section key={group.value} className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{group.label} Plans</h2>
                <p className="text-gray-500 text-sm">{groupServices.length} plan{groupServices.length === 1 ? '' : 's'} configured</p>
              </div>
              <span className="px-3 py-1 text-sm rounded-full bg-blue-50 text-primary">{group.label}</span>
            </div>

            {groupServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupServices.map((service) => (
                  <div key={service._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    {service.imageURL ? (
                      <img
                        src={service.imageURL}
                        alt={service.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
                          <p className="text-xs text-primary font-medium">{group.label}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {service.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
                      
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl font-bold text-primary">₹{service.price}</span>
                        <div className="text-right">
                          <span className="text-sm text-gray-500 capitalize block">{service.frequency}</span>
                          <span className="text-xs text-gray-400">{service.duration} mins</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2">Features:</p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {service.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="flex items-center">
                              <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(service)}
                          className="flex-1 flex items-center justify-center space-x-2 bg-blue-50 text-primary px-4 py-2 rounded-lg hover:bg-blue-100 transition"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(service._id)}
                          className="flex-1 flex items-center justify-center space-x-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No {group.label.toLowerCase()} services yet. Click "Add Service" to create one.
              </div>
            )}
          </section>
        )
      })}

      {services.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No services found. Add your first service!</p>
        </div>
      )}

      {/* Add-ons Section */}
      <section className="mt-12 mb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Service Add-ons</h2>
            <p className="text-gray-500 text-sm mt-1">Manage additional services customers can add to their bookings</p>
          </div>
          <button
            onClick={handleAddAddon}
            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Add Addon</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Addon Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {addons.map((addon) => (
                <tr key={addon._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {addon.imageURL ? (
                      <img src={addon.imageURL} alt={addon.name} className="w-12 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{addon.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₹{addon.price}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleEditAddon(addon)}
                        className="text-primary hover:text-blue-700 flex items-center space-x-1 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteAddon(addon._id)}
                        className="text-red-600 hover:text-red-800 flex items-center space-x-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {addons.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No add-ons yet. Click "Add Addon" to create one.
            </div>
          )}
        </div>
      </section>

      {/* Service Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Premium Car Wash"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Describe the service..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="299"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency *
                  </label>
                  <select
                    required
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {frequencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="deluxe">Deluxe</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Type *
                </label>
                <select
                  required
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as 'hatchback-sedan' | 'suv-muv' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {vehicleTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Features (one per line)
                </label>
                <textarea
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Exterior Wash&#10;Interior Vacuum&#10;Dashboard Polish"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Active (visible to customers)
                </label>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Addon Modal */}
      {showAddonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingAddon ? 'Edit Add-on' : 'Add New Add-on'}
              </h2>
            </div>

            <form onSubmit={handleAddonSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add-on Name *
                </label>
                <input
                  type="text"
                  required
                  value={addonFormData.name}
                  onChange={(e) => setAddonFormData({ ...addonFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Engine Bay Cleaning"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={addonFormData.description}
                  onChange={(e) => setAddonFormData({ ...addonFormData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Describe the addon..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={addonFormData.price}
                  onChange={(e) => setAddonFormData({ ...addonFormData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Addon Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAddonImageFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddonModal(false)
                    setAddonFormData({ name: '', price: '', description: '' })
                    setAddonImageFile(null)
                    setEditingAddon(null)
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  disabled={addonSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  disabled={addonSubmitting}
                >
                  {addonSubmitting ? 'Saving...' : editingAddon ? 'Update Add-on' : 'Create Add-on'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
