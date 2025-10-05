import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usersAPI } from '../../services/api'
import { Play, Clock, Award, BookOpen } from 'lucide-react'

const MyCourses = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchEnrolledCourses()
  }, [])

  const fetchEnrolledCourses = async () => {
    try {
      const response = await usersAPI.getEnrolledCourses()
      setEnrolledCourses(response.data.data)
    } catch (error) {
      console.error('Failed to fetch enrolled courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = enrolledCourses.filter(course => {
    // Ensure progress is within 0-100 range before filtering
    const progress = Math.min(Math.max(course.progress || 0, 0), 100)
    
    if (filter === 'completed') return progress === 100
    if (filter === 'in-progress') return progress > 0 && progress < 100
    if (filter === 'not-started') return progress === 0
    return true
  })

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
          <p className="text-gray-600">Manage your learning journey</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Courses
            </button>
            <button
              onClick={() => setFilter('in-progress')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'in-progress'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'completed'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('not-started')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'not-started'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Not Started
            </button>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((enrolledCourse) => (
            <EnrolledCourseCard key={enrolledCourse.course._id} enrolledCourse={enrolledCourse} />
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? "You haven't enrolled in any courses yet."
                : `No ${filter.replace('-', ' ')} courses.`
              }
            </p>
            <Link to="/courses" className="btn-primary">
              Browse Courses
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

const EnrolledCourseCard = ({ enrolledCourse }) => {
  const course = enrolledCourse.course
  // Ensure progress is within 0-100 range
  const progress = Math.min(Math.max(enrolledCourse.progress || 0, 0), 100)

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="relative">
        <img
          src={course.imageUrl || '/api/placeholder/400/225'}
          alt={course.title}
          className="w-full h-48 object-cover"
        />
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs mt-1">{progress}% complete</p>
          </div>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="px-2 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded">
            {course.level}
          </span>
          {progress === 100 && (
            <Award className="h-5 w-5 text-yellow-500" />
          )}
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {course.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{course.duration || 'Self-paced'}</span>
          </div>
          <span className="capitalize">
            {progress === 100 ? 'Completed' : 
             progress > 0 ? 'In Progress' : 'Not Started'}
          </span>
        </div>

        <Link
          to={`/learn/${course._id}`}
          className="w-full btn-primary flex items-center justify-center"
        >
          {progress === 100 ? 'Review Course' : 
           progress > 0 ? 'Continue Learning' : 'Start Learning'}
          <Play className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

export default MyCourses