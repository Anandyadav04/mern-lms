import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { lessonsAPI } from '../../services/api'
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, FileText, Video, Upload, X, FileQuestion, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

const CourseLessons = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    duration: '',
    lessonType: 'video',
    videoUrl: '',
    quizQuestions: [],
    articleContent: '',
    resources: [],
    isPreview: false,
    order: 0,
    course: id
  })

  useEffect(() => {
    fetchLessons()
  }, [id])

  const fetchLessons = async () => {
    try {
      setLoading(true)
      const response = await lessonsAPI.getByCourse(id)
      
      let lessonsData = []
      
      if (Array.isArray(response.data)) {
        lessonsData = response.data
      } else if (response.data && Array.isArray(response.data.data)) {
        lessonsData = response.data.data
      } else if (response.data && response.data.lessons) {
        lessonsData = response.data.lessons
      } else if (response.data && Array.isArray(response.data.results)) {
        lessonsData = response.data.results
      }
      
      console.log('Lessons data:', lessonsData)
      setLessons(lessonsData)
    } catch (error) {
      console.error('Fetch lessons error:', error)
      if (error.response?.status === 404) {
        setLessons([])
      } else {
        toast.error('Failed to fetch lessons')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleVideoSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a video file')
        return
      }
      
      if (file.size > 100 * 1024 * 1024) {
        toast.error('Video file size must be less than 100MB')
        return
      }
      
      setSelectedVideo(file)
    }
  }

  const removeSelectedVideo = () => {
    setSelectedVideo(null)
  }

  // Handle quiz question changes
  const handleQuizQuestionChange = (index, field, value) => {
    const updatedQuestions = [...formData.quizQuestions]
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    }
    setFormData({
      ...formData,
      quizQuestions: updatedQuestions
    })
  }

  const addQuizQuestion = () => {
    setFormData({
      ...formData,
      quizQuestions: [
        ...formData.quizQuestions,
        {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          points: 1
        }
      ]
    })
  }

  const removeQuizQuestion = (index) => {
    const updatedQuestions = formData.quizQuestions.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      quizQuestions: updatedQuestions
    })
  }

  // Handle quiz option changes
  const handleQuizOptionChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...formData.quizQuestions]
    updatedQuestions[questionIndex].options[optionIndex] = value
    setFormData({
      ...formData,
      quizQuestions: updatedQuestions
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      // Validate required fields
      if (!formData.title.trim()) {
        toast.error('Lesson title is required')
        setSubmitting(false)
        return
      }
      
      if (!formData.duration || formData.duration <= 0) {
        toast.error('Please enter a valid duration')
        setSubmitting(false)
        return
      }

      // Type-specific validations
      if (formData.lessonType === 'video') {
        if (!selectedVideo && !formData.videoUrl.trim()) {
          toast.error('Please either upload a video file or provide a video URL')
          setSubmitting(false)
          return
        }
      } else if (formData.lessonType === 'quiz') {
        if (formData.quizQuestions.length === 0) {
          toast.error('Please add at least one quiz question')
          setSubmitting(false)
          return
        }
        
        // Validate each quiz question
        for (const question of formData.quizQuestions) {
          if (!question.question.trim()) {
            toast.error('All quiz questions must have text')
            setSubmitting(false)
            return
          }
          if (question.options.some(opt => !opt.trim())) {
            toast.error('All quiz options must be filled')
            setSubmitting(false)
            return
          }
        }
      } else if (formData.lessonType === 'article') {
        if (!formData.articleContent.trim()) {
          toast.error('Article content is required')
          setSubmitting(false)
          return
        }
      }

      // Create FormData object
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('content', formData.content)
      formDataToSend.append('duration', formData.duration)
      formDataToSend.append('lessonType', formData.lessonType)
      formDataToSend.append('isPreview', formData.isPreview)
      formDataToSend.append('order', editingLesson ? formData.order : lessons.length)
      formDataToSend.append('course', id)

      // Add type-specific data
      if (formData.lessonType === 'video') {
        formDataToSend.append('videoUrl', formData.videoUrl)
        if (selectedVideo) {
          formDataToSend.append('video', selectedVideo)
        }
      } else if (formData.lessonType === 'quiz') {
        formDataToSend.append('quizQuestions', JSON.stringify(formData.quizQuestions))
      } else if (formData.lessonType === 'article') {
        formDataToSend.append('articleContent', formData.articleContent)
      }

      let response
      if (editingLesson) {
        response = await lessonsAPI.update(editingLesson._id, formDataToSend)
        toast.success('Lesson updated successfully')
      } else {
        response = await lessonsAPI.create(formDataToSend)
        toast.success('Lesson created successfully')
      }
      
      setShowModal(false)
      setEditingLesson(null)
      setSelectedVideo(null)
      resetForm()
      fetchLessons()
    } catch (error) {
      console.error('Save lesson error:', error)
      
      if (error.response) {
        const errorData = error.response.data
        if (errorData.errors) {
          const errorMessages = Object.values(errorData.errors).map(err => err.message || err)
          errorMessages.forEach(msg => toast.error(msg))
        } else if (errorData.message) {
          toast.error(errorData.message)
        } else {
          toast.error('Failed to save lesson. Please try again.')
        }
      } else if (error.request) {
        toast.error('Network error. Please check your connection.')
      } else {
        toast.error(error.message || 'Failed to save lesson')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      duration: '',
      lessonType: 'video',
      videoUrl: '',
      quizQuestions: [],
      articleContent: '',
      resources: [],
      isPreview: false,
      order: lessons.length,
      course: id
    })
  }

  const handleEdit = (lesson) => {
    setEditingLesson(lesson)
    setFormData({
      title: lesson.title,
      content: lesson.content,
      duration: lesson.duration,
      lessonType: lesson.lessonType,
      videoUrl: lesson.videoUrl || '',
      quizQuestions: lesson.quizQuestions || [],
      articleContent: lesson.articleContent || '',
      resources: lesson.resources,
      isPreview: lesson.isPreview,
      order: lesson.order,
      course: id
    })
    setSelectedVideo(null)
    setShowModal(true)
  }

  const handleDelete = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return
    
    try {
      await lessonsAPI.delete(lessonId)
      toast.success('Lesson deleted successfully')
      fetchLessons()
    } catch (error) {
      toast.error('Failed to delete lesson')
    }
  }

  const handleReorder = async (index, direction) => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === lessons.length - 1)) return
    
    const newIndex = direction === 'up' ? index - 1 : index + 1
    const reorderedLessons = [...lessons]
    
    const tempOrder = reorderedLessons[index].order
    reorderedLessons[index].order = reorderedLessons[newIndex].order
    reorderedLessons[newIndex].order = tempOrder
    
    const tempLesson = reorderedLessons[index]
    reorderedLessons[index] = reorderedLessons[newIndex]
    reorderedLessons[newIndex] = tempLesson
    
    setLessons(reorderedLessons)
    
    try {
      await Promise.all([
        lessonsAPI.update(reorderedLessons[index]._id, { order: reorderedLessons[index].order }),
        lessonsAPI.update(reorderedLessons[newIndex]._id, { order: reorderedLessons[newIndex].order })
      ])
      toast.success('Lesson order updated')
    } catch (error) {
      toast.error('Failed to reorder lessons')
      fetchLessons()
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingLesson(null)
    setSelectedVideo(null)
    resetForm()
  }

  const getLessonIcon = (lessonType) => {
    switch (lessonType) {
      case 'video':
        return <Video className="w-4 h-4 mr-1" />
      case 'quiz':
        return <FileQuestion className="w-4 h-4 mr-1" />
      case 'article':
        return <BookOpen className="w-4 h-4 mr-1" />
      default:
        return <FileText className="w-4 h-4 mr-1" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const sortedLessons = Array.isArray(lessons) 
    ? [...lessons].sort((a, b) => (a.order || 0) - (b.order || 0))
    : []

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Lessons</h1>
            <p className="text-gray-600 mt-2">Manage and organize your course content</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Lesson
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {sortedLessons.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons yet</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first lesson</p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
              >
                Add Your First Lesson
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {sortedLessons.map((lesson, index) => (
                <li key={lesson._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex flex-col mr-4">
                        <button
                          onClick={() => handleReorder(index, 'up')}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReorder(index, 'down')}
                          disabled={index === sortedLessons.length - 1}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mr-4">
                        {(lesson.order || index) + 1}
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          {getLessonIcon(lesson.lessonType)}
                          <span className="mr-3 capitalize">{lesson.lessonType}</span>
                          <span>{lesson.duration} minutes</span>
                          {lesson.isPreview && (
                            <span className="ml-3 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              Preview
                            </span>
                          )}
                          {lesson.lessonType === 'quiz' && lesson.quizQuestions && (
                            <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {lesson.quizQuestions.length} questions
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(lesson)}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(lesson._id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8 flex justify-between">
          <Link
            to={`/courses/${id}`}
            className="btn-secondary"
          >
            Back to Course
          </Link>
          <Link
            to={`/dashboard`}
            className="btn-primary"
          >
            Finish Editing
          </Link>
        </div>
      </div>

      {/* Add/Edit Lesson Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lesson Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    rows={3}
                    className="input-field"
                    placeholder="Brief description of the lesson..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="input-field"
                    min="1"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lesson Type *
                  </label>
                  <select
                    name="lessonType"
                    value={formData.lessonType}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="video">Video Lesson</option>
                    <option value="article">Article/Text Lesson</option>
                    <option value="quiz">Quiz/Assessment</option>
                  </select>
                </div>
                
                {/* Video Lesson Fields */}
                {formData.lessonType === 'video' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Video File
                      </label>
                      <div className="flex items-center space-x-2">
                        <label className="flex-1 cursor-pointer">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoSelect}
                            className="hidden"
                          />
                          <div className="input-field flex items-center justify-center border-dashed border-2 border-gray-300 hover:border-primary-400 cursor-pointer py-3">
                            <Upload className="w-5 h-5 mr-2" />
                            {selectedVideo ? selectedVideo.name : 'Choose video file'}
                          </div>
                        </label>
                        {selectedVideo && (
                          <button
                            type="button"
                            onClick={removeSelectedVideo}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Max file size: 100MB. Supported formats: MP4, AVI, MOV, etc.
                      </p>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      
                    </div>

               
                  </>
                )}
                
                {/* Article Lesson Fields */}
                {formData.lessonType === 'article' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Article Content *
                    </label>
                    <textarea
                      name="articleContent"
                      value={formData.articleContent}
                      onChange={handleChange}
                      rows={8}
                      className="input-field"
                      placeholder="Write your article content here..."
                      required
                    />
                  </div>
                )}
                
                {/* Quiz Lesson Fields */}
                {formData.lessonType === 'quiz' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quiz Questions *
                    </label>
                    {formData.quizQuestions.map((question, qIndex) => (
                      <div key={qIndex} className="mb-4 p-4 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium">Question {qIndex + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeQuizQuestion(qIndex)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        
                        <input
                          type="text"
                          value={question.question}
                          onChange={(e) => handleQuizQuestionChange(qIndex, 'question', e.target.value)}
                          className="input-field mb-3"
                          placeholder="Enter question text..."
                          required
                        />
                        
                        <div className="space-y-2 mb-3">
                          {question.options.map((option, oIndex) => (
                            <div key={oIndex} className="flex items-center">
                              <input
                                type="radio"
                                name={`correctAnswer-${qIndex}`}
                                checked={question.correctAnswer === oIndex}
                                onChange={() => handleQuizQuestionChange(qIndex, 'correctAnswer', oIndex)}
                                className="mr-2"
                              />
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => handleQuizOptionChange(qIndex, oIndex, e.target.value)}
                                className="input-field flex-1"
                                placeholder={`Option ${oIndex + 1}...`}
                                required
                              />
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center">
                          <label className="text-sm text-gray-700 mr-2">Points:</label>
                          <input
                            type="number"
                            value={question.points}
                            onChange={(e) => handleQuizQuestionChange(qIndex, 'points', parseInt(e.target.value))}
                            className="input-field w-20"
                            min="1"
                            required
                          />
                        </div>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={addQuizQuestion}
                      className="btn-secondary text-sm"
                    >
                      + Add Question
                    </button>
                  </div>
                )}
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPreview"
                    name="isPreview"
                    checked={formData.isPreview}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPreview" className="ml-2 block text-sm text-gray-900">
                    Mark as preview lesson (free to watch)
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : (editingLesson ? 'Update Lesson' : 'Create Lesson')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseLessons