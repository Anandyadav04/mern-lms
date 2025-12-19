import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursesAPI } from '../services/api';
import { Play, Users, Award, BookOpen, ArrowRight, Star, Clock, Loader, AlertCircle } from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the same API method as the Courses page
        const response = await coursesAPI.getAll({
          sort: 'popular',
          limit: 4
        });
        
        // Check if response has the expected structure
        if (response.data && Array.isArray(response.data)) {
          setCourses(response.data);
        } else if (response.data && response.data.data) {
          // Some APIs wrap data in a data property
          setCourses(response.data.data);
        } else {
          throw new Error('Unexpected API response structure');
        }
        
      } catch (err) {
        console.error('API Error:', err);
        setError(err.response?.data?.message || err.message || "Failed to load courses");
        
        // Use fallback data since API failed
        setCourses(fallbackCourses);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Fallback data in case API fails
  const fallbackCourses = [
    {
      id: 1,
      title: "Web Development Bootcamp",
      description: "Learn modern web development from scratch with HTML, CSS, JavaScript, and React",
      imageUrl: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80",
      instructor: { name: "Sarah Johnson" },
      instructorImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80",
      rating: 4.8,
      reviews: 1250,
      duration: "12 hours",
      studentsEnrolled: 3500,
      price: 49.99,
      category: "Development",
      level: "Beginner"
    },
    {
      id: 2,
      title: "Data Science Fundamentals",
      description: "Master the basics of data science, statistics, and machine learning",
      imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
      instructor: { name: "Michael Chen" },
      instructorImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
      rating: 4.7,
      reviews: 980,
      duration: "15 hours",
      studentsEnrolled: 2100,
      price: 59.99,
      category: "Data Science",
      level: "Intermediate"
    },
    {
      id: 3,
      title: "UI/UX Design Masterclass",
      description: "Learn to design beautiful and user-friendly interfaces with Figma",
      imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1364&q=80",
      instructor: { name: "Emma Rodriguez" },
      instructorImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=761&q=80",
      rating: 4.9,
      reviews: 2100,
      duration: "10 hours",
      studentsEnrolled: 3800,
      price: 69.99,
      category: "Design",
      level: "Intermediate"
    },
    {
      id: 4,
      title: "Digital Marketing Strategy",
      description: "Develop effective digital marketing campaigns that convert",
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1115&q=80",
      instructor: { name: "David Wilson" },
      instructorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80",
      rating: 4.6,
      reviews: 850,
      duration: "8 hours",
      studentsEnrolled: 1800,
      price: 39.99,
      category: "Marketing",
      level: "Beginner"
    }
  ];

  const features = [
    {
      icon: <Play className="h-8 w-8" />,
      title: "Video Lessons",
      description: "High-quality video content with interactive features"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Community Learning",
      description: "Connect with instructors and fellow students"
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Certification",
      description: "Earn certificates upon course completion"
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Progress Tracking",
      description: "Monitor your learning journey with detailed analytics"
    }
  ];

  const stats = [
    { value: "5K+", label: "Learners Enrolled" },
    { value: "120+", label: "Courses" },
    { value: "60+", label: "Instructors" },
    { value: "85%", label: "Course Completion Rate" }
  ];

  // Helper function to safely extract instructor name
  const getInstructorName = (course) => {
    if (!course.instructor) return "Unknown Instructor";
    if (typeof course.instructor === 'string') return course.instructor;
    if (course.instructor.name) return course.instructor.name;
    return "Unknown Instructor";
  };

  // Helper function to safely extract student count
  const getStudentCount = (course) => {
    if (course.studentsEnrolled && Array.isArray(course.studentsEnrolled)) {
      return course.studentsEnrolled.length;
    }
    if (typeof course.studentsEnrolled === 'number') {
      return course.studentsEnrolled;
    }
    if (course.students) return course.students;
    return 0;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Image */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-700 text-white overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80" 
            alt="Students learning together" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-primary-800/60"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Learn Without <span className="text-accent-400">Limits</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              Start, switch, or advance your career with thousands of courses from expert instructors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link to="/courses" className="bg-accent-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-accent-600 transition-colors flex items-center justify-center shadow-lg">
                  Browse Courses
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="bg-accent-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-accent-600 transition-colors flex items-center justify-center shadow-lg">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link to="/courses" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors flex items-center justify-center">
                    Browse Courses
                  </Link>
                </>
              )}
            </div>
            
            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="flex flex-col items-center justify-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                  <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                  <div className="text-primary-200 text-sm md:text-base">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Courses Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Popular Courses
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover the most sought-after courses that students are enrolling in right now.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="h-8 w-8 animate-spin text-primary-600" />
              <span className="ml-2 text-gray-600">Loading courses...</span>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                    <div>
                      <p className="text-yellow-700">
                        {error}. Showing sample courses instead.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {courses.map((course) => (
                  <div key={course.id || course._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <div className="relative">
                      <img 
                        src={course.imageUrl || course.image} 
                        alt={course.title} 
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-4 left-4 bg-accent-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        {course.category || course.level}
                      </div>
                      <div className="absolute top-4 right-4 bg-white/90 text-primary-600 text-xs font-semibold px-2 py-1 rounded flex items-center">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400 mr-1" />
                        {course.averageRating || course.rating}
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 h-14">{course.title}</h3>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {course.description}
                      </p>
                      
                      <div className="flex items-center mb-3">
                        <img 
                          src={course.instructorImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"} 
                          alt={getInstructorName(course)} 
                          className="h-8 w-8 rounded-full mr-2"
                        />
                        <span className="text-sm text-gray-600">{getInstructorName(course)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" /> {course.duration}
                        </span>
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" /> 
                          {getStudentCount(course).toLocaleString()} students
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary-600">
                          {course.price === 0 ? 'Free' : `₹${course.price}`}
                        </span>
                        <Link 
                          to={`/courses/${course.id || course._id}`} 
                          className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center"
                        >
                          View Details <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          
          <div className="text-center mt-12">
            <Link 
              to="/courses" 
              className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              View All Courses <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We provide the best learning experience with cutting-edge technology and expert instructors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group text-center p-6 bg-gray-50 rounded-xl hover:bg-primary-50 transition-all duration-300 hover:-translate-y-2">
                <div className="bg-primary-100 text-primary-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:bg-primary-200 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-700">{feature.title}</h3>
                <p className="text-gray-600 group-hover:text-gray-700">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-700 py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 right-0 h-px bg-white"></div>
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white"></div>
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white"></div>
          <div className="absolute left-0 top-0 bottom-0 w-px bg-white"></div>
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white"></div>
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white"></div>
          <div className="absolute right-0 top-0 bottom-0 w-px bg-white"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of students who are already advancing their careers with our courses.
          </p>
          {!isAuthenticated ? (
            <Link to="/register" className="bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-lg font-semibold inline-flex items-center shadow-lg transition-colors">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          ) : (
            <Link to="/courses" className="bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-lg font-semibold inline-flex items-center shadow-lg transition-colors">
              Browse Courses
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}

export default Home