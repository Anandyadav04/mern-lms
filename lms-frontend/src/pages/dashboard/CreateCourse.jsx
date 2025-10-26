import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { coursesAPI } from '../../services/api'
import toast from 'react-hot-toast'

const CreateCourse = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: '',
    level: 'Beginner',
    price: 0,
    duration: '',
    isPublished: false,
    requirements: [''],
    learningOutcomes: [''],
    whatYouGet: ['Full lifetime access', 'Certificate of completion', '30-day money-back guarantee']
  })
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleArrayFieldChange = (field, index, value) => {
    const newArray = [...formData[field]]
    newArray[index] = value
    setFormData({
      ...formData,
      [field]: newArray
    })
  }

  const addArrayFieldItem = (field) => {
    setFormData({
      ...formData,
      [field]: [...formData[field], '']
    })
  }

  const removeArrayFieldItem = (field, index) => {
    if (formData[field].length <= 1) return
    const newArray = formData[field].filter((_, i) => i !== index)
    setFormData({
      ...formData,
      [field]: newArray
    })
  }

  const handleImageChange = (e) => {
    setImage(e.target.files[0])
  }

  const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)

  try {
    const filteredData = {
      ...formData,
      requirements: formData.requirements.filter(req => req.trim() !== ''),
      learningOutcomes: formData.learningOutcomes.filter(outcome => outcome.trim() !== ''),
      whatYouGet: formData.whatYouGet.filter(item => item.trim() !== '')
    }

    const formDataToSend = new FormData()
    
    
    Object.keys(filteredData).forEach(key => {
      if (key !== 'requirements' && key !== 'learningOutcomes' && key !== 'whatYouGet') {
        formDataToSend.append(key, filteredData[key])
      }
    })
    
    
    filteredData.requirements.forEach((req, index) => {
      formDataToSend.append(`requirements[${index}]`, req)
    })

    filteredData.learningOutcomes.forEach((outcome, index) => {
      formDataToSend.append(`learningOutcomes[${index}]`, outcome)
    })

    filteredData.whatYouGet.forEach((item, index) => {
      formDataToSend.append(`whatYouGet[${index}]`, item)
    })
    
    
    if (image) {
      formDataToSend.append('image', image)
    }

    const response = await coursesAPI.create(formDataToSend)
    toast.success('Course created successfully!')
    navigate(`/teach/courses/${response.data.data._id}/lessons`)
  } catch (error) {
    console.error('Error creating course:', error)
    toast.error(error.response?.data?.message || 'Failed to create course')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Course</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary-50 file:text-primary-700
                  hover:file:bg-primary-100"
              />
              <p className="text-sm text-gray-500 mt-1">
                Recommended size: 1280x720 pixels
              </p>
            </div>

            {/* Course Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter course title"
                required
              />
            </div>

            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtitle
              </label>
              <input
                type="text"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter course subtitle"
              />
            </div>

            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe what students will learn in this course"
                required
              />
            </div>

            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements
              </label>
              {formData.requirements.map((requirement, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={requirement}
                    onChange={(e) => handleArrayFieldChange('requirements', index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={`Requirement ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayFieldItem('requirements', index)}
                    className="ml-2 p-2 text-red-600 hover:text-red-700"
                    disabled={formData.requirements.length <= 1}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayFieldItem('requirements')}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                + Add Requirement
              </button>
            </div>

            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What students will learn
              </label>
              {formData.learningOutcomes.map((outcome, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={outcome}
                    onChange={(e) => handleArrayFieldChange('learningOutcomes', index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={`Learning outcome ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayFieldItem('learningOutcomes', index)}
                    className="ml-2 p-2 text-red-600 hover:text-red-700"
                    disabled={formData.learningOutcomes.length <= 1}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayFieldItem('learningOutcomes')}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                + Add Learning Outcome
              </button>
            </div>

            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What students will get
              </label>
              {formData.whatYouGet.map((item, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleArrayFieldChange('whatYouGet', index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={`Benefit ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayFieldItem('whatYouGet', index)}
                    className="ml-2 p-2 text-red-600 hover:text-red-700"
                    disabled={formData.whatYouGet.length <= 1}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayFieldItem('whatYouGet')}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                + Add Benefit
              </button>
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Select category</option>
                  <option value="programming">Programming</option>
                  <option value="design">Design</option>
                  <option value="business">Business</option>
                  <option value="marketing">Marketing</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="health">Health & Fitness</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level *
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., 10 hours, 4 weeks"
                />
              </div>
            </div>

            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Publish this course immediately
              </label>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateCourse