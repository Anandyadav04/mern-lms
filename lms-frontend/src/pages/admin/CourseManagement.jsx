import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const CourseManagement = () => {
  const [courses, setCourses] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [deletingCourse, setDeletingCourse] = useState(false)
  
  const navigate = useNavigate()

  useEffect(() => {
    fetchCourses()
  }, [filter])

  const fetchCourses = async () => {
    setLoading(true)
    setError('')
    try {
      console.log('🔄 Fetching courses from API...')
      const params = filter ? { status: filter } : {}
      
      const response = await adminAPI.getCourses(params)
      console.log('✅ Courses API response:', response.data)
      
      setCourses(response.data.data?.courses || [])
    } catch (error) {
      console.error('❌ Error fetching courses:', error)
      setError('Failed to load courses. Please check if backend routes are implemented.')
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (courseId, status, reason = '') => {
    try {
      console.log(`🔄 Updating course ${courseId} status to ${status}`)
      await adminAPI.updateCourseStatus(courseId, { status, reason })
      
      // Refresh the list
      fetchCourses()
      console.log('✅ Course status updated successfully')
      
      // Show success message based on action
      if (status === 'approved') {
        alert('Course approved successfully!')
      } else if (status === 'rejected') {
        alert('Course rejected successfully!')
      }
    } catch (error) {
      console.error('❌ Error updating course status:', error)
      alert('Failed to update course status. Please try again.')
    }
  }

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone and will remove all course data including lessons and enrollments.')) {
      return
    }

    setDeletingCourse(true)
    try {
      console.log(`🔄 Deleting course ${courseId}`)
      // We need to add this method to our adminAPI
      await adminAPI.deleteCourse(courseId)
      
      // Close modal if open
      setShowCourseModal(false)
      setSelectedCourse(null)
      
      // Refresh the list
      fetchCourses()
      console.log('✅ Course deleted successfully')
      alert('Course deleted successfully!')
    } catch (error) {
      console.error('❌ Error deleting course:', error)
      alert('Failed to delete course. Please try again.')
    } finally {
      setDeletingCourse(false)
    }
  }

  const handleViewCourse = (course) => {
    setSelectedCourse(course)
    setShowCourseModal(true)
  }

  const handleEditCourse = (courseId) => {
    // Navigate to course edit page or open edit modal
    navigate(`/edit-course/${courseId}`)
  }

  const handleViewOnSite = (courseId) => {
    // Open course in new tab on the main site
    window.open(`/courses/${courseId}`, '_blank')
  }

  const getStatusBadge = (course) => {
    const isPublished = course.isPublished
    
    if (isPublished) {
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">APPROVED</span>
    } else {
      return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">PENDING</span>
    }
  }

  const getCourseLevel = (level) => {
    const levelColors = {
      Beginner: 'bg-blue-100 text-blue-800',
      Intermediate: 'bg-yellow-100 text-yellow-800',
      Advanced: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelColors[level] || 'bg-gray-100 text-gray-800'}`}>
        {level}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Course Management</h1>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Loading courses...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
        <div className="flex items-center space-x-4">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            Total: {courses.length} courses
          </span>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Courses</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
          <div className="text-sm mt-2">
            Make sure the backend route <code>GET /api/admin/courses</code> is implemented.
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">No courses found</div>
            <div className="text-sm text-gray-400">
              {error ? 'Check backend implementation' : 'No courses match your filter criteria'}
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses.map(course => (
                <tr key={course._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img 
                        src={course.imageUrl || '/default-course.png'} 
                        alt="Course" 
                        className="w-12 h-12 rounded object-cover mr-3"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{course.title}</div>
                        <div className="text-sm text-gray-500">{course.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{course.instructor?.name || 'Unknown'}</div>
                      <div className="text-gray-500 text-xs">{course.instructor?.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getCourseLevel(course.level)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ₹{course.price || 0}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(course)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="text-center">
                      <div className="font-semibold">{course.studentsEnrolled?.length || 0}</div>
                      <div className="text-xs text-gray-500">enrolled</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(course.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-1">
                      <button 
                        onClick={() => handleViewCourse(course)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        👁️ View Details
                      </button>
                      {!course.isPublished && (
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => handleStatusUpdate(course._id, 'approved')}
                            className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 flex-1"
                          >
                            ✅ Approve
                          </button>
                          <button 
                            onClick={() => {
                              const reason = prompt('Enter rejection reason:')
                              if (reason) handleStatusUpdate(course._id, 'rejected', reason)
                            }}
                            className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 flex-1"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      )}
                      <button 
                        onClick={() => handleViewOnSite(course._id)}
                        className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700"
                      >
                        🌐 View on Site
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Course Details Modal */}
      {showCourseModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Course Details</h3>
              <button 
                onClick={() => setShowCourseModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-4">
                <img 
                  src={selectedCourse.imageUrl || '/default-course.png'} 
                  alt="Course" 
                  className="w-24 h-24 rounded object-cover"
                />
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900">{selectedCourse.title}</h4>
                  {selectedCourse.subtitle && (
                    <p className="text-gray-600 mt-1">{selectedCourse.subtitle}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getStatusBadge(selectedCourse)}
                    {getCourseLevel(selectedCourse.level)}
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                      {selectedCourse.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-gray-700">Instructor:</label>
                  <p>{selectedCourse.instructor?.name} ({selectedCourse.instructor?.email})</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Price:</label>
                  <p>${selectedCourse.price || 'Free'}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Duration:</label>
                  <p>{selectedCourse.duration || 'Not specified'}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Students Enrolled:</label>
                  <p>{selectedCourse.studentsEnrolled?.length || 0}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Created:</label>
                  <p>{new Date(selectedCourse.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Rating:</label>
                  <p>⭐ {selectedCourse.averageRating?.toFixed(1) || 'No ratings yet'}</p>
                </div>
              </div>

              <div>
                <label className="font-medium text-gray-700">Description:</label>
                <p className="text-gray-600 mt-1 whitespace-pre-wrap">{selectedCourse.description}</p>
              </div>

              {selectedCourse.ratings && selectedCourse.ratings.length > 0 && (
                <div>
                  <label className="font-medium text-gray-700">Recent Reviews:</label>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                    {selectedCourse.ratings.slice(0, 3).map((rating, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-3 py-1">
                        <div className="flex items-center">
                          <span className="text-yellow-500">⭐ {rating.rating}</span>
                          {rating.review && (
                            <span className="ml-2 text-gray-600 text-sm">"{rating.review}"</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            
              
            </div>

            <div className="px-6 py-4 border-t flex justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDeleteCourse(selectedCourse._id)}
                  disabled={deletingCourse}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
                >
                  {deletingCourse ? 'Deleting...' : 'Delete Course'}
                </button>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
                <button
                  onClick={() => handleViewOnSite(selectedCourse._id)}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  View on Site
                </button>
                {!selectedCourse.isPublished && (
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedCourse._id, 'approved')
                      setShowCourseModal(false)
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Approve Course
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-gray-500 text-sm">
        <p>Showing {courses.length} courses • {courses.filter(c => !c.isPublished).length} pending approval</p>
      </div>
    </div>
  )
}

export default CourseManagement