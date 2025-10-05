import { Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Courses from './pages/courses/Courses'
import CourseDetail from './pages/courses/CourseDetail'
import Dashboard from './pages/dashboard/Dashboard'
import Profile from './pages/dashboard/Profile'
import MyCourses from './pages/dashboard/MyCourses'
import CreateCourse from './pages/dashboard/CreateCourse'
import CourseLessons from './pages/dashboard/CourseLessons'
import CourseLearning from './pages/dashboard/CourseLearning'
import EditCourse from './pages/dashboard/EditCourse'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Admin components
import AdminLayout from './components/layout/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import CourseManagement from './pages/admin/CourseManagement'
import Analytics from './pages/admin/Analytics'

// Layout component for regular pages
const RegularLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">
      {children}
    </main>
    <Footer />
  </div>
)

function App() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <Routes>
        {/* Admin Routes - SEPARATE layout (no Navbar/Footer) */}
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="courses" element={<CourseManagement />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        {/* Public Routes with Layout */}
        <Route path="/" element={
          <RegularLayout>
            <Home />
          </RegularLayout>
        } />
        <Route path="/login" element={
          <RegularLayout>
            <Login />
          </RegularLayout>
        } />
        <Route path="/register" element={
          <RegularLayout>
            <Register />
          </RegularLayout>
        } />
        <Route path="/courses" element={
          <RegularLayout>
            <Courses />
          </RegularLayout>
        } />
        <Route path="/courses/:id" element={
          <RegularLayout>
            <CourseDetail />
          </RegularLayout>
        } />
        
        {/* Protected Student/Instructor Routes with Layout */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <RegularLayout>
              <Dashboard />
            </RegularLayout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <RegularLayout>
              <Profile />
            </RegularLayout>
          </ProtectedRoute>
        } />
        <Route path="/my-courses" element={
          <ProtectedRoute>
            <RegularLayout>
              <MyCourses />
            </RegularLayout>
          </ProtectedRoute>
        } />
        <Route path="/create-course" element={
          <ProtectedRoute allowedRoles={['instructor', 'admin']}>
            <RegularLayout>
              <CreateCourse />
            </RegularLayout>
          </ProtectedRoute>
        } />
        <Route path="/edit-course/:id" element={
          <ProtectedRoute allowedRoles={['instructor', 'admin']}>
            <RegularLayout>
              <EditCourse />
            </RegularLayout>
          </ProtectedRoute>
        } />
        <Route path="/teach/courses/:id/lessons" element={
          <ProtectedRoute allowedRoles={['instructor', 'admin']}>
            <RegularLayout>
              <CourseLessons />
            </RegularLayout>
          </ProtectedRoute>
        } />
        
        {/* Course Learning Route - This might need a different layout */}
        <Route path="/learn/:courseId" element={
          <ProtectedRoute allowedRoles={['student','instructor','admin']}>
            <CourseLearning />
          </ProtectedRoute>
        } />

        {/* Fallback route */}
        <Route path="*" element={
          <RegularLayout>
            <div>Page Not Found</div>
          </RegularLayout>
        } />
      </Routes>
    </div>
  )
}

export default App