import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'

const Analytics = () => {
  const [overview, setOverview] = useState(null)
  const [userAnalytics, setUserAnalytics] = useState(null)
  const [courseAnalytics, setCourseAnalytics] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAnalyticsOverview()
  }, [])

  const fetchAnalyticsOverview = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getAnalyticsOverview()
      setOverview(response.data.data)
    } catch (error) {
      console.error('Error fetching analytics overview:', error)
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserAnalytics = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getUserAnalytics()
      setUserAnalytics(response.data.data)
    } catch (error) {
      console.error('Error fetching user analytics:', error)
      setError('Failed to load user analytics')
    } finally {
      setLoading(false)
    }
  }

  const fetchCourseAnalytics = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getCourseAnalytics()
      setCourseAnalytics(response.data.data)
    } catch (error) {
      console.error('Error fetching course analytics:', error)
      setError('Failed to load course analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setError('')
    
    if (tab === 'users' && !userAnalytics) {
      fetchUserAnalytics()
    } else if (tab === 'courses' && !courseAnalytics) {
      fetchCourseAnalytics()
    }
  }

  const downloadReport = async (type, format = 'csv') => {
    try {
      const response = await adminAPI.generateReport(type, format)
      
      if (format === 'csv') {
        // Create and download CSV file
        const blob = new Blob([response.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        // For JSON, show in new tab
        const win = window.open('', '_blank')
        win.document.write(`<pre>${JSON.stringify(response.data, null, 2)}</pre>`)
      }
    } catch (error) {
      console.error('Error downloading report:', error)
      alert('Failed to download report')
    }
  }

  if (loading && activeTab === 'overview') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Analytics & Reports</h1>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Loading analytics...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => downloadReport('users', 'csv')}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
          >
            📊 Users Report
          </button>
          <button 
            onClick={() => downloadReport('courses', 'csv')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            📚 Courses Report
          </button>
          <button 
            onClick={() => downloadReport('enrollments', 'csv')}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
          >
            🎯 Enrollments Report
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'courses', 'users', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Students</h3>
              <p className="text-3xl font-bold text-blue-600">{overview.overview.totalStudents}</p>
              <p className="text-sm text-gray-500 mt-1">+{overview.growth.newStudents} this month</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Instructors</h3>
              <p className="text-3xl font-bold text-green-600">{overview.overview.totalInstructors}</p>
              <p className="text-sm text-gray-500 mt-1">+{overview.growth.newInstructors} this month</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Courses</h3>
              <p className="text-3xl font-bold text-purple-600">{overview.overview.totalCourses}</p>
              <p className="text-sm text-gray-500 mt-1">+{overview.growth.newCourses} this month</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Enrollments</h3>
              <p className="text-3xl font-bold text-yellow-600">{overview.overview.totalEnrollments}</p>
              <p className="text-sm text-gray-500 mt-1">Active enrollments</p>
            </div>
          </div>

          {/* Course Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Course Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Published Courses</span>
                  <span className="font-semibold text-green-600">{overview.overview.publishedCourses}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Approval</span>
                  <span className="font-semibold text-yellow-600">{overview.overview.pendingCourses}</span>
                </div>
                <div className="flex justify-between">
                  <span>Approval Rate</span>
                  <span className="font-semibold text-blue-600">
                    {overview.overview.totalCourses > 0 
                      ? Math.round((overview.overview.publishedCourses / overview.overview.totalCourses) * 100) 
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Growth Metrics */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Monthly Growth</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>New Students</span>
                  <span className="font-semibold text-green-600">+{overview.growth.newStudents}</span>
                </div>
                <div className="flex justify-between">
                  <span>New Instructors</span>
                  <span className="font-semibold text-blue-600">+{overview.growth.newInstructors}</span>
                </div>
                <div className="flex justify-between">
                  <span>New Courses</span>
                  <span className="font-semibold text-purple-600">+{overview.growth.newCourses}</span>
                </div>
              </div>
            </div>

            {/* Platform Health */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Platform Health</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Active Users</span>
                  <span className="font-semibold text-green-600">
                    {overview.overview.totalStudents + overview.overview.totalInstructors}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Enrollment Rate</span>
                  <span className="font-semibold text-blue-600">
                    {overview.overview.totalStudents > 0 
                      ? Math.round((overview.overview.totalEnrollments / overview.overview.totalStudents) * 10) / 10 
                      : 0} per student
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Content Quality</span>
                  <span className="font-semibold text-purple-600">
                    {overview.popularCourses.length > 0 
                      ? (overview.popularCourses.reduce((sum, course) => sum + (course.averageRating || 0), 0) / overview.popularCourses.length).toFixed(1)
                      : 'N/A'} ⭐
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Courses */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Most Popular Courses</h3>
            <div className="space-y-3">
              {overview.popularCourses.map((course, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b">
                  <div className="flex-1">
                    <div className="font-medium">{course.title}</div>
                    <div className="text-sm text-gray-500">by {course.instructorName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{course.studentsCount} students</div>
                    <div className="text-sm text-gray-500">
                      ⭐ {course.averageRating?.toFixed(1) || 'No ratings'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3">Loading user analytics...</span>
            </div>
          ) : userAnalytics ? (
            <>
              {/* User Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Students</h3>
                  <p className="text-3xl font-bold text-blue-600">{userAnalytics.stats.totalStudents}</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Active Users</h3>
                  <p className="text-3xl font-bold text-green-600">{userAnalytics.stats.activeUsers}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {Math.round((userAnalytics.stats.activeUsers / userAnalytics.stats.totalStudents) * 100)}% of total
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Enrollments</h3>
                  <p className="text-3xl font-bold text-purple-600">{userAnalytics.stats.totalEnrollments}</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Avg Courses/User</h3>
                  <p className="text-3xl font-bold text-yellow-600">{userAnalytics.stats.averageCoursesPerUser}</p>
                </div>
              </div>

              {/* Top Engaged Users */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Most Engaged Students</h3>
                <div className="space-y-3">
                  {userAnalytics.users.slice(0, 10).map((user, index) => (
                    <div key={user._id} className="flex justify-between items-center py-2 border-b">
                      <div className="flex-1">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{user.courseCount} courses</div>
                        <div className="text-sm text-gray-500">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Engagement Distribution */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">User Engagement Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {userAnalytics.users.filter(u => u.courseCount === 0).length}
                    </div>
                    <div className="text-sm text-gray-600">Not Enrolled</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {userAnalytics.users.filter(u => u.courseCount >= 1 && u.courseCount <= 3).length}
                    </div>
                    <div className="text-sm text-gray-600">1-3 Courses</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {userAnalytics.users.filter(u => u.courseCount > 3).length}
                    </div>
                    <div className="text-sm text-gray-600">4+ Courses</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No user analytics data available</div>
            </div>
          )}
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3">Loading course analytics...</span>
            </div>
          ) : courseAnalytics ? (
            <>
              {/* Course Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Courses</h3>
                  <p className="text-3xl font-bold text-blue-600">{courseAnalytics.stats.totalCourses}</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Published Courses</h3>
                  <p className="text-3xl font-bold text-green-600">{courseAnalytics.stats.publishedCourses}</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Enrollments</h3>
                  <p className="text-3xl font-bold text-purple-600">{courseAnalytics.stats.totalEnrollments}</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Avg Enrollments</h3>
                  <p className="text-3xl font-bold text-yellow-600">{courseAnalytics.stats.averageEnrollments}</p>
                </div>
              </div>

              {/* Top Performing Courses */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Top Performing Courses</h3>
                <div className="space-y-3">
                  {courseAnalytics.courses.slice(0, 10).map((course, index) => (
                    <div key={course._id} className="flex justify-between items-center py-2 border-b">
                      <div className="flex-1">
                        <div className="font-medium">{course.title}</div>
                        <div className="text-sm text-gray-500">
                          by {course.instructorName} • {course.category}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{course.enrollmentCount} students</div>
                        <div className="text-sm text-gray-500">
                          ⭐ {course.averageRating?.toFixed(1) || 'No ratings'} • {course.reviewCount} reviews
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course Performance by Category */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Performance by Category</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from(new Set(courseAnalytics.courses.map(c => c.category))).slice(0, 6).map(category => {
                    const categoryCourses = courseAnalytics.courses.filter(c => c.category === category)
                    const totalEnrollments = categoryCourses.reduce((sum, c) => sum + c.enrollmentCount, 0)
                    const avgRating = categoryCourses.reduce((sum, c) => sum + (c.averageRating || 0), 0) / categoryCourses.length
                    
                    return (
                      <div key={category} className="p-4 border rounded-lg">
                        <div className="font-semibold text-gray-900">{category}</div>
                        <div className="text-sm text-gray-600 mt-2">
                          {categoryCourses.length} courses
                        </div>
                        <div className="text-sm text-gray-600">
                          {totalEnrollments} enrollments
                        </div>
                        <div className="text-sm text-gray-600">
                          ⭐ {avgRating.toFixed(1)} avg rating
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No course analytics data available</div>
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Generate Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 text-center">
              <h4 className="font-semibold mb-2">Users Report</h4>
              <p className="text-sm text-gray-600 mb-4">Complete user list with enrollment data</p>
              <button 
                onClick={() => downloadReport('users', 'csv')}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Download CSV
              </button>
            </div>
            
            <div className="border rounded-lg p-4 text-center">
              <h4 className="font-semibold mb-2">Courses Report</h4>
              <p className="text-sm text-gray-600 mb-4">All courses with performance metrics</p>
              <button 
                onClick={() => downloadReport('courses', 'csv')}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Download CSV
              </button>
            </div>
            
            <div className="border rounded-lg p-4 text-center">
              <h4 className="font-semibold mb-2">Enrollments Report</h4>
              <p className="text-sm text-gray-600 mb-4">Detailed enrollment records</p>
              <button 
                onClick={() => downloadReport('enrollments', 'csv')}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Analytics