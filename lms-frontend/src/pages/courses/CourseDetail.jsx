import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { coursesAPI, lessonsAPI } from '../../services/api'
import { Star, Clock, Users, Play, CheckCircle, BookOpen, AlertCircle, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const CourseDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [instructorCourses, setInstructorCourses] = useState([])
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    fetchCourseData()
  }, [id, user])

  const fetchCourseData = async () => {
    try {
      setLoading(true)
      const [courseResponse, lessonsResponse] = await Promise.all([
        coursesAPI.getById(id),
        lessonsAPI.getByCourse(id)
      ])
      
      const courseData = courseResponse.data.data.course
      const lessonsData = lessonsResponse.data.data
      
      setCourse(courseData)
      setLessons(lessonsData)
      
      const invalidLessons = lessonsData.filter(lesson => 
        !lesson.title || !lesson.content
      )
      
      if (invalidLessons.length > 0) {
        console.warn('Course has lessons missing required fields:', invalidLessons)
      }
      
      if (user && user.enrolledCourses) {
        let userEnrolled = false
        
        for (let enrollment of user.enrolledCourses) {
          if (!enrollment || !enrollment.course) continue
          
          if (typeof enrollment.course === 'string') {
            if (enrollment.course === id) {
              userEnrolled = true
              break
            }
          } else if (enrollment.course._id === id) {
            userEnrolled = true
            break
          }
        }
        
        setIsEnrolled(userEnrolled)
        
        if (!userEnrolled && courseData.instructor?._id) {
          try {
            const instructorCoursesResponse = await coursesAPI.getByInstructor(
              courseData.instructor._id
            )
            setInstructorCourses(
              instructorCoursesResponse.data.data.courses.filter(c => c._id !== id)
            )
          } catch (error) {
            console.error('Failed to fetch instructor courses:', error)
          }
        }
      } else {
        setIsEnrolled(false)
      }
    } catch (error) {
      console.error('Failed to fetch course data:', error)
      if (error.response?.status === 400) {
        toast.error('Course data is incomplete. Please contact support.')
      } else {
        toast.error('Failed to load course')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to enroll in this course')
      navigate('/login', { state: { from: `/courses/${id}` } })
      return
    }

    const invalidLessons = lessons.filter(lesson => 
      !lesson.title || !lesson.content
    )
    
    if (invalidLessons.length > 0) {
      toast.error('This course has incomplete content. Please try again later.')
      return
    }

    setEnrolling(true)
    try {
      await coursesAPI.enroll(id)
      toast.success('Successfully enrolled in course!')
      setIsEnrolled(true)
      
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      console.error('Enrollment failed:', error)
      
      if (error.response?.status === 400) {
        const errorMessage = error.response.data.message || 'Course data is invalid'
        if (errorMessage.includes('validation failed')) {
          toast.error('This course has incomplete content. Please contact the instructor.')
        } else {
          toast.error(errorMessage)
        }
      } else {
        toast.error(error.response?.data?.message || 'Failed to enroll in course')
      }
    } finally {
      setEnrolling(false)
    }
  }

  const calculateTotalDuration = () => {
    return lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0)
  }

  const formatDuration = (minutes) => {
    if (!minutes) return '0m'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getCompletedLessonsCount = () => {
    if (!user || !user.completedLessons) return 0
    return user.completedLessons.filter(lesson => 
      lessons.some(l => l._id === lesson.lessonId)
    ).length
  }

  const isCourseReady = () => {
    if (lessons.length === 0) return false
    const invalidLessons = lessons.filter(lesson => 
      !lesson.title || !lesson.content
    )
    return invalidLessons.length === 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-4">The course you're looking for doesn't exist.</p>
          <Link to="/courses" className="text-primary-600 hover:text-primary-700">
            Browse all courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
              <p className="text-gray-600 text-lg mb-6">{course.description}</p>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  <span>{course.rating || 'No ratings yet'}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-400 mr-1" />
                  <span>{course.enrolledCount || 0} students</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-1" />
                  <span>{formatDuration(calculateTotalDuration())}</span>
                </div>
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 text-gray-400 mr-1" />
                  <span>{lessons.length} lessons</span>
                </div>
              </div>

              {!isCourseReady() && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                    <p className="text-yellow-800 text-sm">
                      This course is still being set up. Some content may not be available yet.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <img
                  src={course.instructor?.avatar || '/api/placeholder/40/40'}
                  alt={course.instructor?.name}
                  className="h-10 w-10 rounded-full mr-3"
                />
                <div>
                  <p className="font-medium text-gray-900">Created by {course.instructor?.name || 'Unknown Instructor'}</p>
                  <p className="text-sm text-gray-600">{course.instructor?.bio || ''}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 border sticky top-4">
                <img
                  src={course.imageUrl || '/api/placeholder/400/225'}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                
                <div className="text-center mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    {course.price === 0 || !course.price ? 'Free' : `₹${course.price}`}
                  </span>
                </div>

                {isEnrolled ? (
                  <Link
                    to={`/learn/${course._id}`}
                    className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 mb-4"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Continue Learning
                  </Link>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling || !isCourseReady()}
                    className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                  >
                    {enrolling ? 'Processing...' : (
                      !isCourseReady() ? 'Course Not Ready' : (
                        course.price === 0 || !course.price ? 'Enroll Now' : 'Buy Now'
                      )
                    )}
                  </button>
                )}

                <div className="text-sm text-gray-600 space-y-2">
                  <p>✅ Full lifetime access</p>
                  <p>✅ Certificate of completion</p>
                  <p>✅ 30-day money-back guarantee</p>
                  {!isCourseReady() && (
                    <p className="text-yellow-600 text-xs">⚠️ Course content is being updated</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">What you'll learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {course.learningObjectives?.map((objective, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{objective}</span>
                  </div>
                )) || (
                  <p className="text-gray-500">No learning objectives specified.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Course Content</h2>
                <div className="text-sm text-gray-600">
                  {lessons.length} lessons • {formatDuration(calculateTotalDuration())}
                  {isEnrolled && (
                    <span className="ml-2 text-primary-600">
                      {getCompletedLessonsCount()}/{lessons.length} completed
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {lessons.map((lesson, index) => (
                  <div key={lesson._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {lesson.title || `Lesson ${index + 1}`}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDuration(lesson.duration || 0)}
                          {(!lesson.title || !lesson.content) && (
                            <span className="ml-2 text-yellow-600 text-xs">(Incomplete)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {isEnrolled ? (
                      <Link
                        to={`/learn/${course._id}/lesson/${lesson._id}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <Play className="h-5 w-5" />
                      </Link>
                    ) : (
                      <div className="w-5 h-5"></div>
                    )}
                  </div>
                ))}
                
                {lessons.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No lessons available yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-bold text-gray-900 mb-3">Requirements</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {course.requirements?.map((req, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    {req}
                  </li>
                )) || (
                  <li className="text-gray-500">No specific requirements.</li>
                )}
              </ul>
            </div>

            {course.targetAudience && course.targetAudience.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-bold text-gray-900 mb-3">Who this course is for</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {course.targetAudience.map((audience, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      {audience}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {instructorCourses.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-bold text-gray-900 mb-3">More from {course.instructor?.name}</h3>
                <div className="space-y-3">
                  {instructorCourses.slice(0, 3).map(instructorCourse => (
                    <Link
                      key={instructorCourse._id}
                      to={`/courses/${instructorCourse._id}`}
                      className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50"
                    >
                      <img
                        src={instructorCourse.imageUrl || '/api/placeholder/60/40'}
                        alt={instructorCourse.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {instructorCourse.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {instructorCourse.price === 0 ? 'Free' : `₹${instructorCourse.price}`}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseDetail