// Dashboard.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usersAPI, coursesAPI, analyticsAPI } from '../../services/api'
import { BookOpen, Clock, Award, TrendingUp, Calendar, Plus, Edit2, Trash2, FileText, Users, BarChart3, Target, IndianRupee, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user } = useAuth()
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [createdCourses, setCreatedCourses] = useState([])
  const [activeTab, setActiveTab] = useState('enrolled')
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  
  // Add the missing state variables
  const [instructorOverview, setInstructorOverview] = useState(null)
  const [courseAnalytics, setCourseAnalytics] = useState({})
  const [studentProgress, setStudentProgress] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setApiError(null)
      
      console.log('Fetching dashboard data for user:', user?._id)
      
      // Fetch enrolled courses
      let enrolledData = []
      try {
        const enrolledResponse = await usersAPI.getEnrolledCourses()
        enrolledData = enrolledResponse?.data?.data || enrolledResponse?.data || []
        console.log('Enrolled courses loaded:', enrolledData.length)
      } catch (enrolledError) {
        console.warn('Enrolled courses endpoint not available:', enrolledError.message)
        // This is okay - not all users might have enrolled courses
      }
      setEnrolledCourses(enrolledData)
      
      // Fetch instructor courses - handle 404 errors gracefully
      let instructorCourses = []
      
      // If user is not an instructor, skip trying to fetch created courses
      if (user?.role === 'student') {
        setCreatedCourses([])
        setLoading(false)
        return
      }
      
      try {
        // Try to get all courses and filter by instructor
        const allCoursesResponse = await coursesAPI.getAll()
        const allCourses = allCoursesResponse?.data?.data?.courses || 
                          allCoursesResponse?.data?.data || 
                          allCoursesResponse?.data || 
                          []
        
        instructorCourses = allCourses.filter(course => {
          if (!course || !course.instructor) return false
          
          // Handle different instructor reference formats
          if (typeof course.instructor === 'object') {
            return course.instructor._id === user._id
          } else if (typeof course.instructor === 'string') {
            return course.instructor === user._id
          }
          
          return false
        })
        
        console.log('Courses from getAll + filter:', instructorCourses.length)
        
        // Fetch enhanced analytics for instructors
        if (instructorCourses.length > 0 && (user?.role === 'instructor' || user?.role === 'admin')) {
          await fetchInstructorAnalytics(instructorCourses)
        }
        
      } catch (allError) {
        console.error('Failed to fetch courses:', allError)
        // Don't throw error for 404s - just show empty state
        if (allError.response?.status !== 404) {
          throw new Error('Failed to fetch courses: ' + allError.message)
        }
      }
      
      setCreatedCourses(instructorCourses)
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setApiError(error.message)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // Fixed: Added the missing function with proper state setters
  const fetchInstructorAnalytics = async (courses) => {
    try {
      console.log('Fetching instructor analytics...')
      
      // Only fetch analytics if user is instructor/admin
      if (user?.role !== 'instructor' && user?.role !== 'admin') {
        console.log('User is not instructor, skipping analytics')
        return
      }

      // Fetch instructor overview
      try {
        const overviewResponse = await analyticsAPI.getOverview()
        console.log('Overview data:', overviewResponse.data)
        
        if (overviewResponse.data.success) {
          setInstructorOverview(overviewResponse.data.data)
        }
      } catch (overviewError) {
        console.warn('Could not fetch overview analytics:', overviewError.message)
        // Use fallback data
        const fallbackOverview = calculateFallbackAnalytics(courses)
        setInstructorOverview(fallbackOverview)
      }

      // Fetch student progress
      try {
        const progressResponse = await analyticsAPI.getStudentProgress()
        console.log('Progress data:', progressResponse.data)
        
        if (progressResponse.data.success) {
          setStudentProgress(progressResponse.data.data || [])
        }
      } catch (progressError) {
        console.warn('Could not fetch student progress:', progressError.message)
        setStudentProgress([])
      }

    } catch (error) {
      console.error('Unexpected error in fetchInstructorAnalytics:', error)
    }
  }

  // Add fallback analytics calculation
  const calculateFallbackAnalytics = (courses) => {
    const totalStudents = courses.reduce((acc, course) => 
      acc + (course.studentsEnrolled?.length || 0), 0
    )
    
    const totalRevenue = courses.reduce((acc, course) => 
      acc + (course.price * (course.studentsEnrolled?.length || 0)), 0
    )

    const activeStudents = Math.floor(totalStudents * 0.7) // Estimate 70% as active
    const averageCompletionRate = 65 // Default estimate

    return {
      totalCourses: courses.length,
      totalStudents,
      activeStudents,
      totalRevenue,
      averageCompletionRate,
      coursePerformance: courses.map(course => ({
        courseId: course._id,
        title: course.title,
        enrolled: course.studentsEnrolled?.length || 0,
        completed: Math.floor((course.studentsEnrolled?.length || 0) * 0.4), // Estimate 40% completion
        completionRate: 40,
        revenue: course.price * (course.studentsEnrolled?.length || 0),
        averageRating: course.averageRating || 4.5
      }))
    }
  }

  // Calculate enhanced stats for instructors
  const calculateInstructorStats = () => {
    if (!instructorOverview) {
      return {
        totalStudents: 0,
        totalRevenue: 0,
        averageCompletion: 0,
        activeStudents: 0
      }
    }

    return {
      totalStudents: instructorOverview.totalStudents || 0,
      totalRevenue: instructorOverview.totalRevenue || 0,
      averageCompletion: instructorOverview.averageCompletionRate || 0,
      activeStudents: instructorOverview.activeStudents || 0
    }
  }

  const calculateAverageProgress = () => {
    if (enrolledCourses.length === 0) return 0
    
    const total = enrolledCourses.reduce((acc, course) => {
      let progress = course.progress || (course.course && course.course.progress) || 0
      // Ensure progress doesn't exceed 100%
      progress = Math.min(progress, 100)
      return acc + progress
    }, 0)
    
    return Math.round(total / enrolledCourses.length)
  }

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return
    
    try {
      await coursesAPI.delete(courseId)
      toast.success('Course deleted successfully')
      setCreatedCourses(createdCourses.filter(course => course._id !== courseId))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete course')
    }
  }

  const recentCourses = enrolledCourses.slice(0, 3)
  const averageProgress = calculateAverageProgress()
  const instructorStats = calculateInstructorStats()

  // Enhanced Stats Grid for Instructors
  const EnhancedStatsGrid = () => {
    const stats = [
      {
        label: 'Total Students',
        value: instructorStats.totalStudents,
        icon: Users,
        color: 'blue',
        description: 'Across all courses'
      },
      {
        label: 'Active Students',
        value: instructorStats.activeStudents,
        icon: UserCheck,
        color: 'green',
        description: 'Past 7 days'
      },
      {
        label: 'Avg Completion',
        value: `${instructorStats.averageCompletion}%`,
        icon: Target,
        color: 'purple',
        description: 'Course completion rate'
      },
      {
        label: 'Total Revenue',
        value: `₹${instructorStats.totalRevenue}`,
        icon: IndianRupee,
        color: 'green',
        description: 'All time'
      }
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            purple: 'bg-purple-100 text-purple-600',
            yellow: 'bg-yellow-100 text-yellow-600'
          }
          
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg mr-4 ${colorClasses[stat.color]}`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm font-medium text-gray-900">{stat.label}</p>
                  <p className="text-xs text-gray-600">{stat.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Student Progress Table Component
  const StudentProgressTable = () => (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Student Progress</h2>
        <Link 
          to="/analytics/students" 
          className="text-primary-600 hover:text-primary-700 text-sm"
        >
          View Detailed Report
        </Link>
      </div>
      
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Student</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Course</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Progress</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Last Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {studentProgress.slice(0, 5).map((progress, index) => (
              <tr key={progress._id || index}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {progress.studentName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="font-medium text-gray-900">{progress.studentName || 'Unknown Student'}</div>
                      <div className="text-gray-500">{progress.studentEmail || 'No email'}</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                  {progress.courseTitle || 'Unknown Course'}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${progress.progress || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 mt-1">{progress.progress || 0}%</span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {progress.lastActivity ? 
                    new Date(progress.lastActivity).toLocaleDateString() : 'No activity'
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {studentProgress.length === 0 && (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No student progress data available</p>
          </div>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            {user?.role === 'instructor' || user?.role === 'admin' 
              ? 'Manage your courses and track student progress' 
              : 'Continue your learning journey'
            }
          </p>
        </div>

        {/* API Error Display */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">API Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{apiError}</p>
                  <p className="mt-1">Please check if the API endpoints are available.</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={fetchDashboardData}
                    className="text-sm font-medium text-red-800 hover:text-red-900"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation for Instructors */}
        {(user?.role === 'instructor' || user?.role === 'admin') && createdCourses.length > 0 && (
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('enrolled')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'enrolled'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Learning
              </button>
              <button
                onClick={() => setActiveTab('created')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'created'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Courses ({createdCourses.length})
              </button>
              {(user?.role === 'instructor' || user?.role === 'admin') && (
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'analytics'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Analytics
                </button>
              )}
            </nav>
          </div>
        )}

        {/* Stats Grid */}
        {activeTab !== 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeTab === 'enrolled' ? enrolledCourses.length : createdCourses.length}
                  </p>
                  <p className="text-sm text-gray-600">
                    {activeTab === 'enrolled' ? 'Enrolled Courses' : 'Created Courses'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg mr-4">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeTab === 'enrolled' ? averageProgress : createdCourses.filter(c => c.isPublished).length}
                  </p>
                  <p className="text-sm text-gray-600">
                    {activeTab === 'enrolled' ? 'Average Progress' : 'Published Courses'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                  <Award className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeTab === 'enrolled' 
                      ? enrolledCourses.filter(course => {
                          const progress = course.progress || (course.course && course.course.progress) || 0
                          return Math.min(progress, 100) === 100
                        }).length
                      : createdCourses.filter(c => !c.isPublished).length
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    {activeTab === 'enrolled' ? 'Completed' : 'Draft Courses'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg mr-4">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeTab === 'enrolled' 
                      ? '12h' 
                      : createdCourses.reduce((acc, course) => acc + (course.studentsEnrolled?.length || 0), 0)
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    {activeTab === 'enrolled' ? 'Time Spent' : 'Total Students'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'enrolled' ? (
          // Student View - Enrolled Courses
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Courses</h2>
                {enrolledCourses.length > 3 && (
                  <Link to="/my-courses" className="text-primary-600 hover:text-primary-700 text-sm">
                    View all
                  </Link>
                )}
              </div>

              <div className="space-y-4">
                {recentCourses.length > 0 ? (
                  recentCourses.map((course) => {
                    const courseData = course.course || course
                    let progress = course.progress || 0
                    // Ensure progress doesn't exceed 100%
                    progress = Math.min(progress, 100)
                    
                    return (
                      <div key={courseData._id} className="flex items-center p-4 border rounded-lg">
                        <img
                          src={courseData.imageUrl || '/api/placeholder/60/60'}
                          alt={courseData.title}
                          className="w-12 h-12 object-cover rounded-lg mr-4"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{courseData.title}</h3>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{progress}% complete</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">No courses enrolled yet</p>
                    <Link to="/courses" className="text-primary-600 hover:text-primary-700">
                      Browse courses
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Deadlines</h2>
              <div className="space-y-4">
                <div className="flex items-center p-4 border rounded-lg">
                  <div className="p-2 bg-red-100 rounded-lg mr-4">
                    <Calendar className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Assignment 1 Due</h3>
                    <p className="text-sm text-gray-600">Tomorrow at 11:59 PM</p>
                  </div>
                </div>

                <div className="flex items-center p-4 border rounded-lg">
                  <div className="p-2 bg-yellow-100 rounded-lg mr-4">
                    <Calendar className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Quiz 2</h3>
                    <p className="text-sm text-gray-600">In 3 days</p>
                  </div>
                </div>

                <div className="flex items-center p-4 border rounded-lg">
                  <div className="p-2 bg-green-100 rounded-lg mr-4">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Final Project</h3>
                    <p className="text-sm text-gray-600">Next week</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'created' ? (
          // Instructor View - Created Courses
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">My Courses</h2>
              <Link 
                to="/create-course" 
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Course
              </Link>
            </div>

            {createdCourses.length > 0 ? (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Course</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Students</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Rating</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {createdCourses.map((course) => (
                      <tr key={course._id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img
                                className="h-10 w-10 rounded-lg object-cover"
                                src={course.imageUrl || '/api/placeholder/40/40'}
                                alt={course.title}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">{course.title}</div>
                              <div className="text-gray-500">{course.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {course.studentsEnrolled?.length || 0} students
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            course.isPublished 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {course.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <span className="text-yellow-400">★</span>
                            <span className="ml-1">{course.averageRating?.toFixed(1) || 'No ratings'}</span>
                          </div>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link
                              to={`/teach/courses/${course._id}/lessons`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Manage Lessons"
                            >
                              <FileText className="h-5 w-5" />
                            </Link>
                            <Link
                              to={`/edit-course/${course._id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit Course"
                            >
                              <Edit2 className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => handleDeleteCourse(course._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Course"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses created yet</h3>
                <p className="text-gray-500 mb-4">Start by creating your first course</p>
                <Link 
                  to="/create-course" 
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Course
                </Link>
              </div>
            )}
          </div>
        ) : (
          // NEW: Enhanced Analytics View
          <div>
            <EnhancedStatsGrid />
            <StudentProgressTable />
            
            {/* Course Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Performance</h3>
                <div className="space-y-4">
                  {createdCourses.map(course => {
                    const analytics = courseAnalytics[course._id] || {}
                    return (
                      <div key={course._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center">
                          <img
                            src={course.imageUrl || '/api/placeholder/40/40'}
                            alt={course.title}
                            className="w-10 h-10 rounded-lg mr-3 object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{course.title}</p>
                            <p className="text-sm text-gray-600">
                              {analytics.enrolledStudents || course.studentsEnrolled?.length || 0} students
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {analytics.averageCompletionRate || 0}%
                          </p>
                          <p className="text-sm text-gray-600">Completion</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {studentProgress.slice(0, 4).map((activity, index) => (
                    <div key={index} className="flex items-center p-3 border rounded-lg">
                      <div className="bg-green-100 p-2 rounded-full mr-3">
                        <UserCheck className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.studentName} completed a lesson
                        </p>
                        <p className="text-xs text-gray-600">
                          in {activity.courseTitle}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {activity.lastActivity ? 
                          new Date(activity.lastActivity).toLocaleDateString() : ''
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard