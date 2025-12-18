import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  lessonsAPI, 
  coursesAPI, 
  certificatesAPI, 
  ratingsAPI,
  progressAPI 
} from '../../services/api';
import { useProgress } from '../../hooks/useProgress';
import StarRating from '../../components/StarRating';
import Quiz from '../../components/Quiz';
import VideoPlayer from '../../components/VideoPlayer';
import ArticleViewer from '../../components/ArticleViewer';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  User, 
  FileText, 
  Clock, 
  Award, 
  Download, 
  FileCheck,
  MessageCircle,
  BookOpen,
  Play,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const CourseLearning = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [certificate, setCertificate] = useState(null);
  
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [courseRatings, setCourseRatings] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [ratingStats, setRatingStats] = useState(null);

  const previousLessonIndexRef = useRef(0);
  
  const {
    userProgress,
    savingProgress,
    lastSaved,
    apiAvailable: progressApiAvailable,
    saveProgress,
    debouncedSaveProgress,
    initializeProgress
  } = useProgress(courseId, lessons, currentLessonIndex);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Memoized helper functions
  const normalizeLessonsData = useCallback((data) => {
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (data?.lessons) return data.lessons;
    return [];
  }, []);

  const mergeLessonsWithProgress = useCallback((lessons, progressLessons) => {
    return lessons.map(lesson => {
      const lessonProgress = progressLessons?.find(
        lp => lp.lessonId === lesson._id
      );
      return {
        ...lesson,
        completed: lessonProgress?.completed || false
      };
    });
  }, []);

  const getVideoUrl = useCallback((lesson) => {
    if (!lesson) return null;
    const url = lesson.videoUrl || lesson.video || lesson.videoLink || lesson.url;
    if (url?.startsWith('/')) {
      return `${API_BASE_URL}${url}`;
    }
    return url;
  }, [API_BASE_URL]);

  const getLessonType = useCallback((lesson) => {
    if (!lesson) return 'video';
    return lesson.lessonType || lesson.type || 'video';
  }, []);

  const isCourseCompleted = useCallback((lessonsArray = lessons) => {
    return lessonsArray.length > 0 && lessonsArray.every(lesson => lesson.completed);
  }, [lessons]);

  const getVideoTimestamp = useCallback(() => {
    const currentLesson = lessons[currentLessonIndex];
    if (getLessonType(currentLesson) === 'video') {
      // This will be handled by VideoPlayer component now
      return 0;
    }
    return 0;
  }, [currentLessonIndex, lessons, getLessonType]);

  // Safe progress saving with error handling
  const safeSaveProgress = useCallback(async (lessonId = null, completed = false) => {
    try {
      const videoTimestamp = getVideoTimestamp();
      await saveProgress(lessonId, completed, videoTimestamp);
    } catch (error) {
      console.error('Error in safeSaveProgress:', error);
    }
  }, [saveProgress, getVideoTimestamp]);

  // Debounced safe save for auto-saves
  const debouncedSafeSaveProgress = useCallback((lessonId = null, completed = false) => {
    const videoTimestamp = getVideoTimestamp();
    debouncedSaveProgress(lessonId, completed, videoTimestamp);
  }, [debouncedSaveProgress, getVideoTimestamp]);

  // Fetch course data
  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [courseResponse, lessonsResponse] = await Promise.all([
        coursesAPI.getById(courseId),
        lessonsAPI.getByCourse(courseId)
      ]);
      
      setCourse(courseResponse.data);
      
      const lessonsData = normalizeLessonsData(lessonsResponse.data);
      const sortedLessons = lessonsData.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      if (sortedLessons.length > 0) {
        try {
          const progressResponse = await progressAPI.getProgress(courseId);
          const userProgressData = progressResponse.data?.data || progressResponse.data;
          
          if (userProgressData?.lessons) {
            const mergedLessons = mergeLessonsWithProgress(sortedLessons, userProgressData.lessons);
            setLessons(mergedLessons);
            
            if (userProgressData.lastAccessedLesson) {
              const lastLessonIndex = mergedLessons.findIndex(
                lesson => lesson._id === userProgressData.lastAccessedLesson
              );
              if (lastLessonIndex !== -1) {
                setCurrentLessonIndex(lastLessonIndex);
                previousLessonIndexRef.current = lastLessonIndex;
              }
            }
          } else {
            setLessons(sortedLessons);
          }
        } catch (progressError) {
          console.log('No progress data found, using default lessons');
          setLessons(sortedLessons);
        }
      } else {
        setLessons(sortedLessons);
      }
      
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast.error('Failed to load course content');
    } finally {
      setLoading(false);
    }
  }, [courseId, normalizeLessonsData, mergeLessonsWithProgress]);

  // Other API functions
  const fetchCourseRatings = useCallback(async () => {
    try {
      const response = await ratingsAPI.getCourseRatings(courseId);
      setCourseRatings(response.data?.data || []);
      
      try {
        const myRatingResponse = await ratingsAPI.getMyRating(courseId);
        if (myRatingResponse.data?.data) {
          setUserRating(myRatingResponse.data.data);
          setRating(myRatingResponse.data.data.rating);
          setFeedback(myRatingResponse.data.data.review || '');
        }
      } catch (error) {
        setUserRating(null);
      }
    } catch (error) {
      console.log('Error fetching ratings:', error);
    }
  }, [courseId]);

  const fetchRatingStats = useCallback(async () => {
    try {
      const response = await ratingsAPI.getRatingStats(courseId);
      setRatingStats(response.data);
    } catch (error) {
      console.log('Error fetching rating stats:', error);
    }
  }, [courseId]);

  const checkCertificate = useCallback(async () => {
    try {
      const response = await certificatesAPI.getUserCertificate(courseId);
      if (response.data) {
        const certificateData = response.data?.data || response.data.certificate || response.data;
        setCertificate(certificateData);
        return;
      }
      setCertificate(null);
    } catch (error) {
      console.log('Certificate check failed:', error);
      setCertificate(null);
    }
  }, [courseId]);

  // Simplified lesson completion handler
  const handleCompleteLesson = async (lessonId) => {
    try {
      setCompleting(true);
      
      const currentLesson = lessons.find(lesson => lesson._id === lessonId);
      if (!currentLesson?.completed) {
        await lessonsAPI.complete(lessonId);
      }
      
      const updatedLessons = lessons.map(lesson => 
        lesson._id === lessonId ? { ...lesson, completed: true } : lesson
      );
      setLessons(updatedLessons);
      
      await safeSaveProgress(lessonId, true);
      toast.success('Lesson marked as completed!');
      
      // Handle course completion
      const courseCompleted = isCourseCompleted(updatedLessons);
      if (courseCompleted && !certificate) {
        await generateCertificate();
        setTimeout(() => setShowRatingModal(true), 2000);
      }
      
      // Auto-advance for non-quiz lessons
      const currentLessonType = getLessonType(lessons[currentLessonIndex]);
      if (currentLessonType !== 'quiz' && currentLessonIndex < lessons.length - 1) {
        setCurrentLessonIndex(currentLessonIndex + 1);
      }
      
    } catch (error) {
      console.error('Error completing lesson:', error);
      
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message;
        if (errorMessage?.includes('already completed')) {
          const updatedLessons = lessons.map(lesson => 
            lesson._id === lessonId ? { ...lesson, completed: true } : lesson
          );
          setLessons(updatedLessons);
          await safeSaveProgress(lessonId, true);
          
          const courseCompleted = isCourseCompleted(updatedLessons);
          if (courseCompleted && !certificate) {
            await generateCertificate();
            setTimeout(() => setShowRatingModal(true), 2000);
          }
          toast.success('Lesson already completed!');
        } else {
          toast.error(errorMessage || 'Failed to mark lesson as completed');
        }
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Request timeout. Please check your connection.');
      } else {
        toast.error('Failed to mark lesson as completed');
      }
    } finally {
      setCompleting(false);
    }
  };

  // Handle quiz passed event
  const handleQuizPassed = () => {
    if (currentLesson) {
      handleCompleteLesson(currentLesson._id).catch(console.error);
    }
  };

  // Navigation with progress saving
  const handleNextLesson = () => {
    if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(prev => {
        previousLessonIndexRef.current = prev;
        return prev + 1;
      });
    }
  };

  const handlePrevLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(prev => {
        previousLessonIndexRef.current = prev;
        return prev - 1;
      });
    }
  };

  // Certificate functions
  const generateCertificate = async () => {
    try {
      setGeneratingCertificate(true);
      const response = await certificatesAPI.generateCertificate(courseId);
      const certificateData = response.data?.data || response.data.certificate || response.data;
      setCertificate(certificateData);
      toast.success('Certificate generated successfully!');
    } catch (error) {
      console.error('Error generating certificate:', error);
      if (error.response?.status === 404) {
        toast.success('Course completed! Certificate feature coming soon.');
      } else {
        toast.error('Course completed! Certificate feature coming soon.');
      }
    } finally {
      setGeneratingCertificate(false);
    }
  };

  const downloadCertificate = async () => {
    try {
      const response = await certificatesAPI.downloadCertificate(certificate._id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificate-${course.title}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('Download feature coming soon');
    }
  };

  const viewCertificate = async () => {
    try {
      const response = await certificatesAPI.viewCertificate(certificate._id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error('Error viewing certificate:', error);
      toast.error('View feature coming soon');
    }
  };

  // Rating functions
  const submitRating = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      setSubmittingRating(true);
      const response = await ratingsAPI.submitRating(courseId, {
        rating,
        review: feedback.trim()
      });
      
      toast.success(userRating ? 'Rating updated successfully!' : 'Thank you for your feedback!');
      setShowRatingModal(false);
      setUserRating(response.data?.data);
      
      await Promise.all([fetchCourseRatings(), fetchRatingStats()]);
      
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const deleteRating = async () => {
    try {
      await ratingsAPI.deleteRating(courseId);
      toast.success('Rating deleted successfully');
      setUserRating(null);
      setRating(0);
      setFeedback('');
      fetchCourseRatings();
      fetchRatingStats();
    } catch (error) {
      console.error('Error deleting rating:', error);
      toast.error('Failed to delete rating');
    }
  };

  // Helper function to get lesson timestamp from progress
  const getLessonTimestamp = (lessonId) => {
    const lessonProgress = userProgress?.lessons?.find(
      lesson => lesson.lessonId === lessonId
    );
    return lessonProgress?.videoTimestamp || 0;
  };

  // Simplified renderLessonContent
  const renderLessonContent = () => {
    if (!currentLesson) return null;

    const videoUrl = getVideoUrl(currentLesson);
    const lessonType = getLessonType(currentLesson);

    switch (lessonType) {
      case 'video':
        return (
          <VideoPlayer 
            videoUrl={videoUrl}
            title={currentLesson.title}
            onTimeUpdate={() => debouncedSafeSaveProgress()}
            initialTimestamp={getLessonTimestamp(currentLesson._id)}
          />
        );

      case 'article':
        return (
          <ArticleViewer 
            content={currentLesson.articleContent || currentLesson.content}
            title={currentLesson.title}
          />
        );

      case 'quiz':
        return (
          <Quiz 
            lesson={currentLesson}
            onQuizPassed={handleQuizPassed}
            onQuizComplete={(score, passed) => {
              // Additional quiz completion logic if needed
            }}
          />
        );

      default:
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 inline" />
            <span className="text-yellow-700">Unsupported lesson type</span>
          </div>
        );
    }
  };

  // useEffect hooks
  useEffect(() => {
    fetchCourseData();
    checkCertificate();
    fetchCourseRatings();
    fetchRatingStats();
  }, []);

  // Save progress when lesson changes
  useEffect(() => {
    if (lessons.length > 0 && currentLessonIndex >= 0 && !loading) {
      if (currentLessonIndex !== previousLessonIndexRef.current) {
        debouncedSafeSaveProgress();
        previousLessonIndexRef.current = currentLessonIndex;
      }
    }
  }, [currentLessonIndex, lessons, loading, debouncedSafeSaveProgress]);

  // Progress Indicator Component
  const ProgressIndicator = () => (
    <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 rounded-lg">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${
          savingProgress ? 'bg-yellow-500 animate-pulse' : 
          progressApiAvailable ? 'bg-green-500' : 'bg-gray-400'
        }`} />
        <span className="text-sm text-gray-600">
          {savingProgress ? 'Saving progress...' : 
           progressApiAvailable ? 'Progress saved' : 'Progress tracking offline'}
        </span>
      </div>
      {lastSaved && progressApiAvailable && (
        <span className="text-xs text-gray-500">
          Last saved: {lastSaved.toLocaleTimeString()}
        </span>
      )}
      {!progressApiAvailable && (
        <span className="text-xs text-yellow-600">
          Progress will be saved locally only
        </span>
      )}
    </div>
  );

  // Loading and Error States
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!course || lessons.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h2>
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or has no lessons.</p>
          <Link to="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentLesson = lessons[currentLessonIndex];
  const courseCompleted = isCourseCompleted();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
              <p className="text-gray-600">by {course.instructor?.name || 'Unknown Instructor'}</p>
            </div>
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
              Exit Course
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressIndicator />
        
        {/* Certificate Banner */}
        {courseCompleted && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <FileCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Course Completed! 🎉</h3>
                  <p className="text-green-700">
                    Congratulations on completing "{course.title}"!
                    {certificate ? ' Your certificate is ready.' : ' Certificate feature coming soon.'}
                  </p>
                </div>
              </div>
              {certificate ? (
                <div className="flex space-x-3">
                  <button
                    onClick={viewCertificate}
                    className="btn-secondary flex items-center"
                  >
                    <FileCheck className="w-4 h-4 mr-2" />
                    View Certificate
                  </button>
                  <button
                    onClick={downloadCertificate}
                    className="btn-primary flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </button>
                </div>
              ) : (
                <button
                  onClick={generateCertificate}
                  disabled={generatingCertificate}
                  className="btn-primary flex items-center"
                >
                  {generatingCertificate ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4 mr-2" />
                      Get Certificate
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Course Rating Section */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Course Reviews</h3>
              {ratingStats && (
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    <StarRating rating={parseFloat(ratingStats.averageRating)} readonly={true} size="lg" />
                    <span className="ml-2 text-2xl font-bold text-gray-900">
                      {ratingStats.averageRating}
                    </span>
                    <span className="ml-1 text-gray-500">/5</span>
                  </div>
                  <span className="ml-4 text-gray-500">
                    ({ratingStats.totalRatings} {ratingStats.totalRatings === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
            </div>
            
            {courseCompleted && (
              <button
                onClick={() => setShowRatingModal(true)}
                className="btn-primary flex items-center"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {userRating ? 'Update Review' : 'Add Review'}
              </button>
            )}
          </div>

          {/* Rating Distribution */}
          {ratingStats && ratingStats.totalRatings > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center">
                    <span className="text-sm text-gray-600 w-8">{star} star</span>
                    <div className="flex-1 mx-2 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{
                          width: `${(ratingStats.ratingDistribution[star] / ratingStats.totalRatings) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12">
                      {ratingStats.ratingDistribution[star]} 
                      ({ratingStats.totalRatings > 0 
                        ? Math.round((ratingStats.ratingDistribution[star] / ratingStats.totalRatings) * 100) 
                        : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews List */}
          {courseRatings.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">
                {showAllReviews ? 'All Reviews' : 'Recent Reviews'}
              </h4>
              {(showAllReviews ? courseRatings : courseRatings.slice(0, 3)).map((rating) => (
                <div key={rating._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <User className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 block">
                          {rating.user?.name || 'Anonymous User'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(rating.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center mb-3">
                    <StarRating rating={rating.rating} readonly={true} />
                    <span className="ml-2 text-sm text-gray-600">
                      {rating.rating}/5
                    </span>
                  </div>
                  {rating.review && (
                    <p className="text-gray-700">{rating.review}</p>
                  )}
                </div>
              ))}
              
              {courseRatings.length > 3 && (
                <button
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  {showAllReviews ? 'Show Less' : `Show All ${courseRatings.length} Reviews`}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No reviews yet. Be the first to review this course!</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Lessons List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Course Content</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {lessons.filter(l => l.completed).length} of {lessons.length} lessons completed
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(lessons.filter(l => l.completed).length / lessons.length) * 100}%` 
                    }}
                  />
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {lessons.map((lesson, index) => (
                  <button
                    key={lesson._id}
                    onClick={() => setCurrentLessonIndex(index)}
                    className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      index === currentLessonIndex ? 'bg-blue-50 border-blue-200' : ''
                    } ${lesson.completed ? 'text-green-700' : 'text-gray-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3 text-xs ${
                          lesson.completed 
                            ? 'bg-green-100 border-green-300 text-green-700' 
                            : index === currentLessonIndex
                            ? 'bg-blue-100 border-blue-300 text-blue-700'
                            : 'bg-gray-100 border-gray-300 text-gray-500'
                        }`}>
                          {lesson.completed ? <CheckCircle className="w-3 h-3" /> : index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{lesson.title}</div>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {lesson.duration || '10 min'}
                            <span className="mx-2">•</span>
                            {getLessonType(lesson) === 'video' && <Play className="w-3 h-3 mr-1" />}
                            {getLessonType(lesson) === 'article' && <BookOpen className="w-3 h-3 mr-1" />}
                            {getLessonType(lesson) === 'quiz' && <FileText className="w-3 h-3 mr-1" />}
                            {getLessonType(lesson)}
                          </div>
                        </div>
                      </div>
                      {lesson.completed && (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Lesson Header */}
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {currentLesson?.title || 'Lesson Not Found'}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Lesson {currentLessonIndex + 1} of {lessons.length}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getLessonType(currentLesson) === 'video' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        <Play className="w-4 h-4 mr-1" />
                        Video Lesson
                      </span>
                    )}
                    {getLessonType(currentLesson) === 'article' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                        <BookOpen className="w-4 h-4 mr-1" />
                        Article
                      </span>
                    )}
                    {getLessonType(currentLesson) === 'quiz' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                        <FileText className="w-4 h-4 mr-1" />
                        Quiz
                      </span>
                    )}
                  </div>
                </div>

                {/* Lesson Description */}
                {currentLesson?.description && (
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {currentLesson.description}
                  </p>
                )}
              </div>

              {/* Lesson Content */}
              <div className="p-6">
                {renderLessonContent()}

                {/* Lesson Actions */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <button
                    onClick={handlePrevLesson}
                    disabled={currentLessonIndex === 0}
                    className="btn-secondary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </button>

                  <div className="flex items-center space-x-4">
                    {getLessonType(currentLesson) !== 'quiz' && (
                      <button
                        onClick={() => handleCompleteLesson(currentLesson._id)}
                        disabled={completing || currentLesson.completed}
                        className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {completing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Marking...
                          </>
                        ) : currentLesson.completed ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completed
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Complete
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleNextLesson}
                    disabled={currentLessonIndex === lessons.length - 1}
                    className="btn-secondary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Rate this Course</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How would you rate this course?
              </label>
              <div className="flex justify-center">
                <StarRating 
                  rating={rating} 
                  onRatingChange={setRating}
                  size="xl"
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                Your Review (Optional)
              </label>
              <textarea
                id="feedback"
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Share your experience with this course..."
              />
            </div>

            <div className="flex justify-between items-center">
              {userRating && (
                <button
                  onClick={deleteRating}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Delete Review
                </button>
              )}
              
              <div className="flex space-x-3 ml-auto">
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRating}
                  disabled={submittingRating || rating === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingRating ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseLearning;