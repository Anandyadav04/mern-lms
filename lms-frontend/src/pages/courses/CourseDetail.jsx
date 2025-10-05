import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { coursesAPI, lessonsAPI } from '../../services/api'
import { Star, Clock, Users, Play, CheckCircle, BookOpen, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const CourseDetail = () => {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [instructorCourses, setInstructorCourses] = useState([])

  useEffect(() => {
    fetchCourseData()
  }, [id])

  const fetchCourseData = async () => {
    try {
      const [courseResponse, lessonsResponse] = await Promise.all([
        coursesAPI.getById(id),
        lessonsAPI.getByCourse(id)
      ])
      
      setCourse(courseResponse.data.data.course)
      setLessons(lessonsResponse.data.data)
      
      if (user) {
        const isUserEnrolled = user.enrolledCourses?.some(
          enrolled => enrolled.course._id === id
        )
        setIsEnrolled(isUserEnrolled)
        
        // Fetch instructor's other courses if user is not enrolled
        if (!isUserEnrolled && courseResponse.data.data.course.instructor?._id) {
          try {
            const instructorCoursesResponse = await coursesAPI.getByInstructor(
              courseResponse.data.data.course.instructor._id
            )
            setInstructorCourses(
              instructorCoursesResponse.data.data.courses.filter(c => c._id !== id)
            )
          } catch (error) {
            console.error('Failed to fetch instructor courses:', error)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch course data:', error)
      toast.error('Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to enroll in this course')
      return
    }

    try {
      await coursesAPI.enroll(id)
      setIsEnrolled(true)
      toast.success('Successfully enrolled in the course!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to enroll')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Course not found</h2>
          <Link 
            to="/courses" 
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            Back to courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
              <p className="text-gray-600 text-lg mb-6">{course.description}</p>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                  <span className="text-gray-700">
                    {course.averageRating?.toFixed(1) || 'No ratings yet'}
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-1" />
                  <span className="text-gray-700">
                    {course.studentsEnrolled?.length || 0} students
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-1" />
                  <span className="text-gray-700">{course.duration || 'Self-paced'}</span>
                </div>
              </div>

              <div className="flex items-center mb-6">
                <img
                  src={course.instructor?.avatar || '/api/placeholder/40/40'}
                  alt={course.instructor?.name}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div>
                  <p className="font-medium">Instructor: {course.instructor?.name}</p>
                  <p className="text-gray-600 text-sm">{course.instructor?.email}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 border">
                <img
                  src={course.imageUrl || '/api/placeholder/400/225'}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                
                <div className="text-center mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    {course.price === 0 || !course.price ? 'Free' : `$${course.price}`}
                  </span>
                </div>

                {isEnrolled ? (
                  <Link
                    to={`/learn/${course._id}`}
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 mb-4"
                  >
                    Continue Learning
                  </Link>
                ) : (
                  <button
                    onClick={handleEnroll}
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 mb-4"
                  >
                    Enroll Now
                  </button>
                )}

                <div className="text-sm text-gray-600 space-y-2">
                  <p>✅ Full lifetime access</p>
                  <p>✅ Certificate of completion</p>
                  <p>✅ 30-day money-back guarantee</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-2xl font-bold mb-6">Course Content</h2>
              
              {lessons.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No content available yet</h3>
                  <p className="text-gray-500">
                    This course doesn't have any lessons yet. Check back later or explore other courses.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lessons.map((lesson, index) => (
                    <div key={lesson._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mr-4">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-medium">{lesson.title}</h3>
                          <p className="text-sm text-gray-600">{lesson.duration} minutes</p>
                        </div>
                      </div>
                      {lesson.isPreview && !isEnrolled && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded">
                          Preview
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-2xl font-bold mb-6">Requirements</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                {course.requirements && course.requirements.length > 0 ? (
                  course.requirements.map((requirement, index) => (
                    <li key={index}>{requirement}</li>
                  ))
                ) : (
                  <li>No specific requirements</li>
                )}
              </ul>
            </div>

            {/* Instructor's other courses section */}
            {instructorCourses.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-6">More from this instructor</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {instructorCourses.slice(0, 4).map(course => (
                    <div key={course._id} className="border rounded-lg p-4 flex">
                      <img 
                        src={course.imageUrl || '/api/placeholder/80/60'} 
                        alt={course.title}
                        className="w-20 h-16 object-cover rounded mr-4"
                      />
                      <div>
                        <h3 className="font-medium text-sm mb-1">{course.title}</h3>
                        <p className="text-xs text-gray-600">
                          {course.studentsEnrolled?.length || 0} students
                        </p>
                        <Link 
                          to={`/courses/${course._id}`}
                          className="text-xs text-primary-600 hover:text-primary-700 mt-2 inline-block"
                        >
                          View course
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold mb-4">What you'll learn</h3>
              
              {course.learningOutcomes && course.learningOutcomes.length > 0 ? (
                <ul className="space-y-3">
                  {course.learningOutcomes.slice(0, 5).map((outcome, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{outcome}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No learning outcomes specified yet.</p>
              )}
            </div>
            
            {/* Course stats */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">This course includes:</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Play className="h-5 w-5 text-primary-600 mr-2" />
                  <span className="text-gray-600">
                    {lessons.length} lessons
                  </span>
                </li>
                <li className="flex items-center">
                  <Clock className="h-5 w-5 text-primary-600 mr-2" />
                  <span className="text-gray-600">
                    {course.duration || 'Self-paced'} total length
                  </span>
                </li>
                <li className="flex items-center">
                  <BookOpen className="h-5 w-5 text-primary-600 mr-2" />
                  <span className="text-gray-600">
                    {course.level || 'All levels'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseDetail