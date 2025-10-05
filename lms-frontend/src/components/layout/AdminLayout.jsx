// components/layout/AdminLayout.jsx
import React from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import { useAuth } from '../../context/AuthContext'

const AdminLayout = () => {
  const { user } = useAuth()
  
  console.log('AdminLayout rendering - User role:', user?.role)
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 overflow-auto">
          <h1>Admin Layout Active - User: {user?.name}</h1>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout