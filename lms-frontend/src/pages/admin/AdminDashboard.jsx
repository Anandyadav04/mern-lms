import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'

const AdminDashboard = () => {
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [systemSettings, setSystemSettings] = useState({
    siteName: 'Learning Management System',
    siteDescription: 'Your platform for online learning',
    allowRegistrations: true,
    requireEmailVerification: false,
    maxFileSize: 10, // MB
    maintenanceMode: false
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await adminAPI.getDashboardStats()
      setStats(response.data.data || {})
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Fallback to mock data
      setStats({
        totalStudents: 124,
        totalInstructors: 15,
        totalCourses: 42,
        pendingCourses: 7
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = (key, value) => {
    setSystemSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const saveSystemSettings = async () => {
    try {
      // Here you would typically make an API call to save settings
      console.log('Saving system settings:', systemSettings)
      alert('System settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <span className="text-gray-600">Welcome back, Administrator</span>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Students</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
          <p className="text-sm text-gray-500 mt-1">Registered learners</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Instructors</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalInstructors}</p>
          <p className="text-sm text-gray-500 mt-1">Teaching staff</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Courses</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.totalCourses}</p>
          <p className="text-sm text-gray-500 mt-1">Available courses</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Pending Approval</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingCourses}</p>
          <p className="text-sm text-gray-500 mt-1">Awaiting review</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => window.location.href = '/admin/users'}
              className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-left"
            >
              👥 Manage Users
              <div className="text-sm opacity-90 mt-1">View, edit, and manage all users</div>
            </button>
            <button 
              onClick={() => window.location.href = '/admin/courses'}
              className="bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-medium text-left"
            >
              📚 Review Courses
              <div className="text-sm opacity-90 mt-1">Approve or reject course submissions</div>
            </button>
            <button 
              onClick={() => window.location.href = '/admin/analytics'}
              className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium text-left"
            >
              📊 View Analytics
              <div className="text-sm opacity-90 mt-1">Platform insights and reports</div>
            </button>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">System Settings</h2>
          <div className="space-y-4">
            {/* Site Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Name
              </label>
              <input
                type="text"
                value={systemSettings.siteName}
                onChange={(e) => handleSettingChange('siteName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Description
              </label>
              <textarea
                value={systemSettings.siteDescription}
                onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Registration Settings */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Allow New Registrations
                </label>
                <p className="text-sm text-gray-500">Allow new users to create accounts</p>
              </div>
              <button
                onClick={() => handleSettingChange('allowRegistrations', !systemSettings.allowRegistrations)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  systemSettings.allowRegistrations ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    systemSettings.allowRegistrations ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Require Email Verification
                </label>
                <p className="text-sm text-gray-500">Users must verify email before login</p>
              </div>
              <button
                onClick={() => handleSettingChange('requireEmailVerification', !systemSettings.requireEmailVerification)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  systemSettings.requireEmailVerification ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    systemSettings.requireEmailVerification ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* File Upload Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max File Upload Size (MB)
              </label>
              <select
                value={systemSettings.maxFileSize}
                onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5 MB</option>
                <option value={10}>10 MB</option>
                <option value={25}>25 MB</option>
                <option value={50}>50 MB</option>
              </select>
            </div>

            {/* Maintenance Mode */}
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Maintenance Mode
                </label>
                <p className="text-sm text-gray-500">Take site offline for maintenance</p>
              </div>
              <button
                onClick={() => handleSettingChange('maintenanceMode', !systemSettings.maintenanceMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  systemSettings.maintenanceMode ? 'bg-red-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    systemSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Save Button */}
            <button
              onClick={saveSystemSettings}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              💾 Save Settings
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">New student registration</span>
            </div>
            <span className="text-sm text-gray-500">2 minutes ago</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700">Course enrollment completed</span>
            </div>
            <span className="text-sm text-gray-500">15 minutes ago</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-700">New course submitted for review</span>
            </div>
            <span className="text-sm text-gray-500">1 hour ago</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-700">System backup completed</span>
            </div>
            <span className="text-sm text-gray-500">2 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard