'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Edit, Trash2, Image as ImageIcon, Car, RefreshCcw } from 'lucide-react'
import api from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'

type VehicleServiceType = 'hatchback-sedan' | 'suv-muv'

interface ServicePriceBase {
  serviceId: string
  serviceName: string
  basePrice: number
}

interface ServicePricePreview extends ServicePriceBase {
  finalPrice: number
}

interface Model {
  _id: string
  name: string
  image?: string
  isActive: boolean
  pricePercentage: number
  serviceType?: VehicleServiceType
  servicePricing?: ServicePricePreview[]
}

interface Brand {
  _id: string
  name: string
  logo: string
  models: Model[]
  isActive: boolean
}

const vehicleServiceOptions: { value: VehicleServiceType; label: string }[] = [
  { value: 'hatchback-sedan', label: 'Hatchback / Sedan' },
  { value: 'suv-muv', label: 'SUV / MUV' }
]

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
})

const formatCurrency = (amount: number) => currencyFormatter.format(Math.round(amount || 0))

const calculateFinalPrice = (basePrice: number, percentage: number) => {
  const price = Number(basePrice) || 0
  const pct = Number(percentage) || 0
  return Number((price + (price * pct) / 100).toFixed(2))
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [showBrandModal, setShowBrandModal] = useState(false)
  const [showModelModal, setShowModelModal] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [editingModel, setEditingModel] = useState<Model | null>(null)
  const [brandFormData, setBrandFormData] = useState({
    name: '',
    isActive: true
  })
  const [modelFormData, setModelFormData] = useState({
    name: '',
    pricePercentage: 0,
    serviceType: 'hatchback-sedan' as VehicleServiceType
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [modelImageFile, setModelImageFile] = useState<File | null>(null)
  const [serviceCache, setServiceCache] = useState<Record<VehicleServiceType, ServicePriceBase[]>>({
    'hatchback-sedan': [],
    'suv-muv': []
  })
  const [serviceBaseLoading, setServiceBaseLoading] = useState(false)
  const [serviceBaseError, setServiceBaseError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      const response = await api.get('/brands')
      setBrands(response.data.data.brands)
    } catch (error) {
      console.error('Error fetching brands:', error)
      alert('Failed to fetch brands')
    } finally {
      setLoading(false)
    }
  }

  const fetchServiceBasePrices = async (type: VehicleServiceType, force = false) => {
    if (!force && serviceCache[type] && serviceCache[type].length > 0) {
      return
    }

    setServiceBaseLoading(true)
    setServiceBaseError('')

    try {
      const response = await api.get('/services', {
        params: { vehicleType: type }
      })

      const basePrices: ServicePriceBase[] = (response.data?.data?.services || []).map((service: any) => ({
        serviceId: service._id,
        serviceName: service.name,
        basePrice: Number(service.price) || 0
      }))

      setServiceCache((prev) => ({
        ...prev,
        [type]: basePrices
      }))
    } catch (error) {
      console.error('Error fetching service base prices:', error)
      setServiceBaseError('Unable to load base prices. Please refresh and try again.')
    } finally {
      setServiceBaseLoading(false)
    }
  }

  useEffect(() => {
    if (showModelModal) {
      fetchServiceBasePrices(modelFormData.serviceType, true)
    }
  }, [showModelModal, modelFormData.serviceType])

  const servicePreview = useMemo<ServicePricePreview[]>(() => {
    const list = serviceCache[modelFormData.serviceType] || []
    return list.map((service) => ({
      ...service,
      finalPrice: calculateFinalPrice(service.basePrice, modelFormData.pricePercentage)
    }))
  }, [serviceCache, modelFormData.serviceType, modelFormData.pricePercentage])

  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const data = new FormData()
      data.append('name', brandFormData.name)
      data.append('isActive', String(brandFormData.isActive))
      
      if (logoFile) {
        data.append('logo', logoFile)
      }

      if (editingBrand) {
        await api.put(`/brands/${editingBrand._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        alert('Brand updated successfully!')
      } else {
        await api.post('/brands', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        alert('Brand created successfully!')
      }

      setShowBrandModal(false)
      resetBrandForm()
      fetchBrands()
    } catch (error: any) {
      console.error('Error saving brand:', error)
      alert(error.response?.data?.message || 'Failed to save brand')
    } finally {
      setSubmitting(false)
    }
  }

  const handleModelSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBrand) return

    try {
      setSubmitting(true)

      // Validate form data
      if (!modelFormData.name.trim()) {
        alert('Please enter a model name')
        setSubmitting(false)
        return
      }

      // Ensure we have a valid service type
      const serviceType = modelFormData.serviceType || 'hatchback-sedan'
      
      // Update the form data with the service type
      setModelFormData(prev => ({
        ...prev,
        serviceType
      }))

      // Create form data
      const formData = new FormData()
      formData.append('name', modelFormData.name.trim())
      formData.append('pricePercentage', modelFormData.pricePercentage.toString())
      formData.append('serviceType', serviceType)
      
      // Debug log the service type being sent
      console.log('Submitting with service type:', serviceType)
      
      // Handle image file if present
      if (modelImageFile) {
        console.log('Appending image file to FormData')
        formData.append('image', modelImageFile)
      } else if (editingModel?.image) {
        // If editing and no new image, ensure we keep the existing image
        formData.append('image', editingModel.image)
      } else {
        console.log('No image file to append')
      }

      // Debug logging
      console.log('Submitting model:', {
        ...modelFormData,
        serviceType: serviceType
      })
      console.log('FormData entries:')
      formData.forEach((value, key) => {
        console.log(`${key}:`, value, typeof value)
      })

      if (editingModel) {
        await api.put(`/brands/${selectedBrand._id}/models/${editingModel._id}`, formData)
        alert('Model updated successfully!')
      } else {
        await api.post(`/brands/${selectedBrand._id}/models`, formData)
        alert('Model added successfully!')
      }

      setShowModelModal(false)
      setModelFormData({
        name: '',
        pricePercentage: 0,
        serviceType: serviceType // Preserve the service type for the next entry
      })
      setModelImageFile(null)
      setSelectedBrand(null)
      setEditingModel(null)
      fetchBrands()
    } catch (error: any) {
      console.error('Error saving model:', error)
      console.error('Error response:', error.response)
      console.error('Error data:', error.response?.data)
      console.error('Error status:', error.response?.status)
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save model'
      alert(`Error: ${errorMessage}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditBrand = (brand: Brand) => {
    setEditingBrand(brand)
    setBrandFormData({
      name: brand.name,
      isActive: brand.isActive
    })
    setShowBrandModal(true)
  }

  const handleDeleteBrand = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand? All associated models will also be deleted.')) return

    try {
      await api.delete(`/brands/${id}`)
      alert('Brand deleted successfully!')
      fetchBrands()
    } catch (error) {
      console.error('Error deleting brand:', error)
      alert('Failed to delete brand')
    }
  }

  const handleDeleteModel = async (brandId: string, modelId: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return

    try {
      await api.delete(`/brands/${brandId}/models/${modelId}`)
      alert('Model deleted successfully!')
      fetchBrands()
    } catch (error) {
      console.error('Error deleting model:', error)
      alert('Failed to delete model')
    }
  }

  const resetBrandForm = () => {
    setBrandFormData({
      name: '',
      isActive: true
    })
    setLogoFile(null)
    setEditingBrand(null)
  }

  const handleCloseBrandModal = () => {
    setShowBrandModal(false)
    resetBrandForm()
  }

  const handleAddModel = (brand: Brand) => {
    console.log('Adding new model to brand:', brand._id)
    setSelectedBrand(brand)
    setEditingModel(null)
    
    // Use the last used service type or default to hatchback-sedan
    const lastServiceType = modelFormData.serviceType || 'hatchback-sedan'
    
    setModelFormData({
      name: '',
      pricePercentage: 0,
      serviceType: lastServiceType
    })
    
    // Pre-fetch the service prices for the last used service type
    fetchServiceBasePrices(lastServiceType, false)
    
    setModelImageFile(null)
    setShowModelModal(true)
  }

  const handleEditModel = async (brand: Brand, model: Model) => {
    console.log('Editing model:', model)
    setSelectedBrand(brand)
    setEditingModel(model)
    
    // Set form data with the model's service type or default to 'hatchback-sedan'
    const serviceType = model.serviceType || 'hatchback-sedan'
    setModelFormData({
      name: model.name,
      pricePercentage: model.pricePercentage || 0,
      serviceType: serviceType
    })
    
    // Reset image file
    setModelImageFile(null)
    
    // Show the modal
    setShowModelModal(true)
    
    // Fetch base prices for the model's service type
    try {
      setServiceBaseLoading(true)
      const response = await api.get(`/services/base-prices?type=${serviceType}`)
      setServiceCache(prev => ({
        ...prev,
        [serviceType]: response.data.data.services
      }))
    } catch (error) {
      console.error('Error fetching service base prices:', error)
      setServiceBaseError('Failed to load service prices')
    } finally {
      setServiceBaseLoading(false)
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
          <h1 className="text-3xl font-bold text-gray-900">Car Brands</h1>
          <p className="text-gray-600 mt-2">Manage car brands and models</p>
        </div>
        <button
          onClick={() => setShowBrandModal(true)}
          className="flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Add Brand</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map((brand) => (
          <div key={brand._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {brand.logo ? (
              <div className="w-full h-48 bg-gray-50 flex items-center justify-center p-4">
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{brand.name}</h3>
                <span className={`px-2 py-1 text-xs rounded ${brand.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {brand.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-700">Models ({brand.models.length})</p>
                  <button
                    onClick={() => handleAddModel(brand)}
                    className="text-xs text-primary hover:text-blue-600"
                  >
                    + Add Model
                  </button>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {brand.models.length > 0 ? (
                    brand.models.map((model) => (
                      <div key={model._id} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                        <div className="flex items-center space-x-2">
                          {model.image ? (
                            <img
                              src={model.image}
                              alt={model.name}
                              className="w-6 h-6 object-cover rounded"
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="flex items-center">
                            <Car className="w-3 h-3 mr-1" />
                            {model.name}
                            {model.pricePercentage > 0 && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                                +{model.pricePercentage}%
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleEditModel(brand, model)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteModel(brand._id, model._id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">No models added</p>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditBrand(brand)}
                  className="flex-1 flex items-center justify-center space-x-2 bg-blue-50 text-primary px-4 py-2 rounded-lg hover:bg-blue-100 transition"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteBrand(brand._id)}
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

      {brands.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No brands found. Add your first brand!</p>
        </div>
      )}

      {/* Brand Modal */}
      {showBrandModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
              </h2>
            </div>

            <form onSubmit={handleBrandSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={brandFormData.name}
                  onChange={(e) => setBrandFormData({ ...brandFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Toyota"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Logo {!editingBrand && '*'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required={!editingBrand}
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {editingBrand && (
                  <p className="text-xs text-gray-500 mt-1">Leave empty to keep current logo</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="brandIsActive"
                  checked={brandFormData.isActive}
                  onChange={(e) => setBrandFormData({ ...brandFormData, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="brandIsActive" className="ml-2 text-sm text-gray-700">
                  Active (visible to customers)
                </label>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseBrandModal}
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
                  {submitting ? 'Saving...' : editingBrand ? 'Update Brand' : 'Create Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Model Modal */}
      {showModelModal && selectedBrand && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingModel ? 'Edit Model' : 'Add Model to'} {selectedBrand.name}
              </h2>
            </div>

            <form onSubmit={handleModelSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model Name *
                </label>
                <input
                  type="text"
                  required
                  value={modelFormData.name}
                  onChange={(e) => setModelFormData({ ...modelFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Camry"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Service Type *
                </label>
                <div className="flex items-center space-x-2">
                  <select
                    value={modelFormData.serviceType}
                    onChange={(e) => {
                      const value = e.target.value as VehicleServiceType
                      console.log('Service type changed to:', value)
                      setModelFormData({ 
                        ...modelFormData, 
                        serviceType: value 
                      })
                      // Automatically refresh base prices when service type changes
                      fetchServiceBasePrices(value, false)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                  >
                    {vehicleServiceOptions.map((option) => (
                      <option 
                        key={option.value} 
                        value={option.value}
                        selected={modelFormData.serviceType === option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => fetchServiceBasePrices(modelFormData.serviceType, true)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                    disabled={serviceBaseLoading}
                    title="Refresh base prices"
                  >
                    <RefreshCcw className={`w-4 h-4 ${serviceBaseLoading ? 'animate-spin text-primary' : 'text-gray-500'}`} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Base prices are synced from the Services page for the selected vehicle type.
                </p>
                {serviceBaseError && (
                  <p className="text-xs text-red-500 mt-1">{serviceBaseError}</p>
                )}
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                  <p>Current selection: <strong>{modelFormData.serviceType === 'suv-muv' ? 'SUV/MUV' : 'Hatchback/Sedan'}</strong></p>
                  {editingModel && editingModel.serviceType !== modelFormData.serviceType && (
                    <p className="mt-1">
                      Previous type: <strong>{editingModel.serviceType === 'suv-muv' ? 'SUV/MUV' : 'Hatchback/Sedan'}</strong>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model Image
                </label>
                {editingModel?.image && (
                  <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">Current image:</p>
                    <img
                      src={editingModel.image}
                      alt={editingModel.name}
                      className="h-20 w-20 object-cover rounded"
                    />
                  </div>
                )}
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    {modelImageFile ? (
                      <div className="space-y-2">
                        <img
                          src={URL.createObjectURL(modelImageFile)}
                          alt="Model preview"
                          className="mx-auto h-32 w-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setModelImageFile(null)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove image
                        </button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer rounded-md font-medium text-primary hover:text-blue-600">
                            <span>Upload a file</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  setModelImageFile(file)
                                }
                              }}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Percentage Increase (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={modelFormData.pricePercentage}
                  onChange={(e) => {
                    const value = Math.min(100, Math.max(0, Number(e.target.value) || 0))
                    setModelFormData({ ...modelFormData, pricePercentage: value })
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., 20"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Percentage will be applied on selected service type base prices (0-100%).
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">
                    {modelFormData.serviceType === 'suv-muv' ? 'SUV/MUV' : 'Hatchback/Sedan'} Service Prices
                  </p>
                  {serviceBaseLoading ? (
                    <span className="text-xs text-gray-500">Loading...</span>
                  ) : (
                    <span className="text-xs text-gray-500">
                      {serviceCache[modelFormData.serviceType]?.length || 0} services
                    </span>
                  )}
                </div>
                
                {serviceBaseLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : serviceCache[modelFormData.serviceType]?.length > 0 ? (
                  <div className="space-y-2">
                    {serviceCache[modelFormData.serviceType].map((service) => (
                      <div key={service.serviceId} className="flex justify-between text-sm">
                        <span>{service.serviceName}</span>
                        <span className="font-medium">
                          {formatCurrency(calculateFinalPrice(service.basePrice, modelFormData.pricePercentage))}
                          <span className="text-xs text-gray-500 ml-1">
                            (base: {formatCurrency(service.basePrice)})
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    No {modelFormData.serviceType === 'suv-muv' ? 'SUV/MUV' : 'Hatchback/Sedan'} services found.
                  </div>
                )}
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModelModal(false)
                    setModelFormData({ name: '', pricePercentage: 0, serviceType: 'hatchback-sedan' })
                    setSelectedBrand(null)
                    setEditingModel(null)
                  }}
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
                  {submitting ? 'Saving...' : editingModel ? 'Update Model' : 'Add Model'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
