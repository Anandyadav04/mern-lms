## Learning Management System (LMS)

A full-stack Learning Management System built with the MERN stack, featuring role-based access control for Students, Instructors, and Admins.

## 🛠️ Tech Stack

- Frontend: React.js, Context API/Hooks, Axios, TailwindCSS
- Backend: Node.js, Express.js, MongoDB, Mongoose
- Authentication: JWT (JSON Web Tokens), bcryptjs
- File Upload: Multer

## 👥 User Roles

- Student: Browse courses, enroll, access materials, submit assignments
- Instructor: Create courses, manage content, grade assignments
- Admin: Manage users, courses, and platform settings

## ⚙️ Installation & Setup
Prerequisites
- Node.js
- MongoDB
- npm or yarn

## 1. Clone the Repository
```bash
git clone https://github.com/Anandyadav04/mern-lms.git
cd mern-lms

2.Setup Backend
cd lms-server

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Add your environment variables:
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret
# PORT=5000

# Start the server
npm run dev

3.Setup Frontend
cd lms-frontend

# Install dependencies
npm install

# Start the frontend
npm start
