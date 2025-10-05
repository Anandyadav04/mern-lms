import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// Image storage
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/images/')
    ensureDir(dir)
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, `course-${uniqueSuffix}${path.extname(file.originalname)}`)
  }
})

// Video storage
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/videos/')
    ensureDir(dir)
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, `lesson-${uniqueSuffix}${path.extname(file.originalname)}`)
  }
})

// ===== File Filters =====
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else {
    cb(new Error('Not an image! Please upload only images.'), false)
  }
}

const videoFilter = (req, file, cb) => {
  // Only apply video filter if the lesson type is video AND field name is 'video'
  if (req.body.lessonType === 'video' && file.fieldname === 'video') {
    if (file.mimetype.startsWith('video')) {
      cb(null, true);
    } else {
      cb(new Error('Not a video! Please upload only videos for video lessons.'), false);
    }
  } else {
    // For non-video lessons or other file fields, skip file processing
    cb(null, false);
  }
};

// ===== Upload Middlewares =====
const uploadImage = multer({ 
  storage: imageStorage, 
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB for images
  }
})

const uploadVideo = multer({ 
  storage: videoStorage, 
  fileFilter: videoFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB for videos
  }
})

// Create a more flexible upload middleware for lessons
const uploadLessonFile = multer({
  storage: videoStorage,
  fileFilter: (req, file, cb) => {
    // Only process video files for video lessons
    if (req.body.lessonType === 'video' && file.fieldname === 'video') {
      if (file.mimetype.startsWith('video')) {
        cb(null, true);
      } else {
        cb(new Error('Not a video! Please upload only videos.'), false);
      }
    } else {
      // Skip file processing for non-video lessons or other fields
      cb(null, false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024
  }
})

// Named exports
export { uploadImage, uploadVideo, uploadLessonFile }