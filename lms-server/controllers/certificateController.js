import Certificate from '../models/Certificate.js';
import Course from '../models/Course.js';
import { v4 as uuidv4 } from 'uuid';
import PDFDocument from 'pdfkit';

// Modern certificate design configuration
const CERTIFICATE_CONFIG = {
  primaryColor: '#2c5aa0',
  secondaryColor: '#4a90e2',
  accentColor: '#f1c40f',
  backgroundColor: '#ffffff',
  borderColor: '#e0e0e0',
  margins: {
    top: 60,
    bottom: 60,
    left: 60,
    right: 60
  },
  font: {
    title: 'Helvetica-Bold',
    subtitle: 'Helvetica-Bold',
    body: 'Helvetica',
    decorative: 'Helvetica-Oblique'
  }
};

// Helper function to draw modern background elements with proper boundaries
const drawCertificateBackground = (doc, width, height) => {
  // Gradient background
  const gradient = doc.linearGradient(0, 0, width, height);
  gradient.stop(0, '#f8f9fa');
  gradient.stop(1, '#ffffff');
  
  doc.rect(0, 0, width, height).fill(gradient);
  
  // Main content area with proper margins
  const contentWidth = width - CERTIFICATE_CONFIG.margins.left - CERTIFICATE_CONFIG.margins.right;
  const contentHeight = height - CERTIFICATE_CONFIG.margins.top - CERTIFICATE_CONFIG.margins.bottom;
  
  // Decorative border
  doc.strokeColor(CERTIFICATE_CONFIG.primaryColor);
  doc.lineWidth(8);
  doc.roundedRect(
    CERTIFICATE_CONFIG.margins.left, 
    CERTIFICATE_CONFIG.margins.top, 
    contentWidth, 
    contentHeight, 
    15
  ).stroke();
  
  // Inner subtle border
  doc.strokeColor(CERTIFICATE_CONFIG.borderColor);
  doc.lineWidth(1);
  doc.roundedRect(
    CERTIFICATE_CONFIG.margins.left + 10, 
    CERTIFICATE_CONFIG.margins.top + 10, 
    contentWidth - 20, 
    contentHeight - 20, 
    10
  ).stroke();
  
  // Corner decorations
  doc.fillColor(CERTIFICATE_CONFIG.secondaryColor);
  doc.opacity(0.1);
  
  const cornerSize = 80;
  doc.polygon([0, 0], [cornerSize, 0], [0, cornerSize]).fill();
  doc.polygon([width, 0], [width - cornerSize, 0], [width, cornerSize]).fill();
  doc.polygon([0, height], [cornerSize, height], [0, height - cornerSize]).fill();
  doc.polygon([width, height], [width - cornerSize, height], [width, height - cornerSize]).fill();
  
  doc.opacity(1);
};

// Helper function to add text with proper boundaries
const addTextWithBoundaries = (doc, text, x, y, options = {}) => {
  const { 
    width = 400, 
    align = 'left', 
    fontSize = 12, 
    font = 'Helvetica',
    color = '#000000' 
  } = options;
  
  doc.font(font).fontSize(fontSize).fillColor(color);
  return doc.text(text, x, y, {
    width: width,
    align: align,
    lineBreak: true
  });
};

// Generate certificate
const generateCertificate = async (req, res) => {
  try {
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if already issued
    const existing = await Certificate.findOne({ user: req.user._id, course: courseId });
    if (existing) return res.json({ certificate: existing });

    const certificate = await Certificate.create({
      user: req.user._id,
      course: courseId,
      certificateCode: uuidv4(),
    });

    res.status(201).json({ certificate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating certificate' });
  }
};

// Get user's certificate for a specific course
const getUserCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      user: req.user._id,
      course: req.params.courseId,
    }).populate('course user', 'title name email');
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.json({ certificate });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching certificate' });
  }
};

// Get all certificates of user
const getUserCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ user: req.user._id })
      .populate('course', 'title')
      .populate('user', 'name');
    res.json({ certificates });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching certificates' });
  }
};

// Get certificate by ID
const getCertificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('course', 'title description duration instructor')
      .populate('user', 'name email');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.json({ certificate });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching certificate' });
  }
};

// Download certificate as PDF with proper layout
const downloadCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('course user');
    
    if (!certificate) return res.status(404).json({ message: 'Certificate not found' });

    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margins: { 
        top: CERTIFICATE_CONFIG.margins.top, 
        bottom: CERTIFICATE_CONFIG.margins.bottom, 
        left: CERTIFICATE_CONFIG.margins.left, 
        right: CERTIFICATE_CONFIG.margins.right 
      }
    });

    res.setHeader('Content-Disposition', `attachment; filename=certificate-${certificate.certificateCode}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const contentWidth = pageWidth - CERTIFICATE_CONFIG.margins.left - CERTIFICATE_CONFIG.margins.right;
    const contentHeight = pageHeight - CERTIFICATE_CONFIG.margins.top - CERTIFICATE_CONFIG.margins.bottom;

    // Draw modern background with proper boundaries
    drawCertificateBackground(doc, pageWidth, pageHeight);

    // Calculate positions relative to content area
    const contentX = CERTIFICATE_CONFIG.margins.left;
    const contentY = CERTIFICATE_CONFIG.margins.top;
    const centerX = contentX + contentWidth / 2;

    // Certificate Header - Centered within content area
    doc.fillColor(CERTIFICATE_CONFIG.primaryColor)
       .fontSize(36)
       .font(CERTIFICATE_CONFIG.font.title);
    
    const titleText = 'CERTIFICATE OF COMPLETION';
    const titleWidth = doc.widthOfString(titleText);
    const titleX = centerX - titleWidth / 2;
    
    doc.text(titleText, titleX, contentY + 40);

    // Decorative separator - centered and within bounds
    doc.strokeColor(CERTIFICATE_CONFIG.accentColor)
       .lineWidth(2);
    
    const separatorWidth = 200;
    const separatorX = centerX - separatorWidth / 2;
    doc.moveTo(separatorX, contentY + 90)
       .lineTo(separatorX + separatorWidth, contentY + 90)
       .stroke();

    // Main content with proper text wrapping
    const textAreaWidth = contentWidth - 80; // Padding inside the border
    const textAreaX = contentX + 40;

    // Presentation text
    addTextWithBoundaries(doc, 
      'This certificate is proudly presented to', 
      textAreaX, contentY + 130, {
        width: textAreaWidth,
        align: 'center',
        fontSize: 18,
        font: CERTIFICATE_CONFIG.font.body,
        color: '#333333'
    });

    // Student name (highlighted) - with max width to prevent overflow
    const studentName = certificate.user.name.toUpperCase();
    doc.fillColor(CERTIFICATE_CONFIG.primaryColor)
       .fontSize(28)
       .font(CERTIFICATE_CONFIG.font.title);
    
    // Calculate name width and center it
    const nameWidth = doc.widthOfString(studentName);
    const nameX = Math.max(textAreaX, centerX - nameWidth / 2);
    
    // If name is too long, reduce font size
    if (nameWidth > textAreaWidth) {
      doc.fontSize(24);
    }
    
    doc.text(studentName, nameX, contentY + 180, {
      width: textAreaWidth,
      align: 'center',
      lineBreak: true
    });

    // Course completion text
    addTextWithBoundaries(doc, 
      'for successfully completing the course', 
      textAreaX, contentY + 250, {
        width: textAreaWidth,
        align: 'center',
        fontSize: 16,
        font: CERTIFICATE_CONFIG.font.body,
        color: '#333333'
    });

    // Course title - handle long course names
    const courseTitle = `"${certificate.course.title}"`;
    doc.fillColor(CERTIFICATE_CONFIG.secondaryColor)
       .fontSize(20)
       .font(CERTIFICATE_CONFIG.font.subtitle);
    
    // Check if course title fits, reduce font size if too long
    const courseTitleWidth = doc.widthOfString(courseTitle);
    if (courseTitleWidth > textAreaWidth) {
      doc.fontSize(16);
    }
    
    doc.text(courseTitle, textAreaX, contentY + 290, {
      width: textAreaWidth,
      align: 'center',
      lineBreak: true
    });

    // Details section - properly aligned within boundaries
    const detailsY = contentY + 350;
    
    // Issued date
    const issuedDate = certificate.issuedAt.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    addTextWithBoundaries(doc, 
      `Issued on: ${issuedDate}`, 
      textAreaX, detailsY, {
        width: textAreaWidth / 2 - 10,
        align: 'left',
        fontSize: 12,
        font: CERTIFICATE_CONFIG.font.body,
        color: '#666666'
    });

    // Certificate ID - right aligned
    addTextWithBoundaries(doc, 
      `Certificate ID: ${certificate.certificateCode}`, 
      centerX + 10, detailsY, {
        width: textAreaWidth / 2 - 10,
        align: 'right',
        fontSize: 12,
        font: CERTIFICATE_CONFIG.font.body,
        color: '#666666'
    });

    // Footer signatures area - within content boundaries
    const signatureY = contentY + contentHeight - 100;
    
    // Left signature area
    doc.strokeColor('#cccccc')
       .lineWidth(1);
    
    const leftSignatureX = textAreaX + 50;
    doc.moveTo(leftSignatureX, signatureY + 20)
       .lineTo(leftSignatureX + 150, signatureY + 20)
       .stroke();
    
    addTextWithBoundaries(doc, 
      'Course Instructor', 
      leftSignatureX, signatureY + 25, {
        width: 150,
        align: 'center',
        fontSize: 10,
        color: '#333333'
    });

    // Right signature area
    const rightSignatureX = contentX + contentWidth - 200;
    doc.moveTo(rightSignatureX, signatureY + 20)
       .lineTo(rightSignatureX + 150, signatureY + 20)
       .stroke();
    
    addTextWithBoundaries(doc, 
      'Learning Institution', 
      rightSignatureX, signatureY + 25, {
        width: 150,
        align: 'center',
        fontSize: 10,
        color: '#333333'
    });

    // Verification QR placeholder - bottom right corner within bounds
    const qrSize = 60;
    const qrX = contentX + contentWidth - qrSize - 20;
    const qrY = contentY + contentHeight - qrSize - 20;
    
    doc.rect(qrX, qrY, qrSize, qrSize)
       .strokeColor('#999999')
       .lineWidth(1)
       .stroke();
    
    addTextWithBoundaries(doc, 
      'Verify Online', 
      qrX, qrY + qrSize + 5, {
        width: qrSize,
        align: 'center',
        fontSize: 8,
        color: '#999999'
    });

    doc.end();
    doc.pipe(res);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ message: 'Error generating PDF certificate' });
  }
};

// View certificate (inline with proper layout)
const viewCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id).populate('course user');
    if (!certificate) return res.status(404).json({ message: 'Certificate not found' });

    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margins: { 
        top: CERTIFICATE_CONFIG.margins.top, 
        bottom: CERTIFICATE_CONFIG.margins.bottom, 
        left: CERTIFICATE_CONFIG.margins.left, 
        right: CERTIFICATE_CONFIG.margins.right 
      }
    });

    res.setHeader('Content-Disposition', 'inline; filename=certificate.pdf');
    res.setHeader('Content-Type', 'application/pdf');

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const contentWidth = pageWidth - CERTIFICATE_CONFIG.margins.left - CERTIFICATE_CONFIG.margins.right;
    const contentX = CERTIFICATE_CONFIG.margins.left;
    const contentY = CERTIFICATE_CONFIG.margins.top;
    const centerX = contentX + contentWidth / 2;
    const textAreaWidth = contentWidth - 80;
    const textAreaX = contentX + 40;

    // Draw background
    drawCertificateBackground(doc, pageWidth, pageHeight);

    // Content with proper boundaries (similar to download but simplified)
    doc.fillColor(CERTIFICATE_CONFIG.primaryColor)
       .fontSize(36)
       .font(CERTIFICATE_CONFIG.font.title)
       .text('CERTIFICATE OF COMPLETION', textAreaX, contentY + 40, {
         width: textAreaWidth,
         align: 'center'
       });

    doc.strokeColor(CERTIFICATE_CONFIG.accentColor)
       .lineWidth(2);
    
    const separatorWidth = 200;
    const separatorX = centerX - separatorWidth / 2;
    doc.moveTo(separatorX, contentY + 90)
       .lineTo(separatorX + separatorWidth, contentY + 90)
       .stroke();

    addTextWithBoundaries(doc, 
      'This certificate is proudly presented to', 
      textAreaX, contentY + 130, {
        width: textAreaWidth,
        align: 'center',
        fontSize: 18,
        color: '#333333'
    });

    const studentName = certificate.user.name.toUpperCase();
    doc.fillColor(CERTIFICATE_CONFIG.primaryColor)
       .fontSize(28)
       .font(CERTIFICATE_CONFIG.font.title)
       .text(studentName, textAreaX, contentY + 180, {
         width: textAreaWidth,
         align: 'center',
         lineBreak: true
       });

    addTextWithBoundaries(doc, 
      'for successfully completing the course', 
      textAreaX, contentY + 250, {
        width: textAreaWidth,
        align: 'center',
        fontSize: 16,
        color: '#333333'
    });

    doc.fillColor(CERTIFICATE_CONFIG.secondaryColor)
       .fontSize(20)
       .font(CERTIFICATE_CONFIG.font.subtitle)
       .text(`"${certificate.course.title}"`, textAreaX, contentY + 290, {
         width: textAreaWidth,
         align: 'center',
         lineBreak: true
       });

    // Verification note at bottom
    addTextWithBoundaries(doc, 
      `Certificate ID: ${certificate.certificateCode} • Issued: ${certificate.issuedAt.toLocaleDateString()}`, 
      textAreaX, contentY + contentHeight - 50, {
        width: textAreaWidth,
        align: 'center',
        fontSize: 10,
        color: '#999999'
    });

    doc.end();
    doc.pipe(res);
  } catch (error) {
    console.error('Certificate View Error:', error);
    res.status(500).json({ message: 'Error viewing certificate' });
  }
};

// Verify certificate
const verifyCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('course user', 'title name email issuedAt');

    if (!certificate) return res.status(404).json({ valid: false, message: 'Certificate not found' });

    res.json({ 
      valid: true, 
      certificate: {
        id: certificate._id,
        certificateCode: certificate.certificateCode,
        issuedAt: certificate.issuedAt,
        studentName: certificate.user.name,
        studentEmail: certificate.user.email,
        courseTitle: certificate.course.title,
        verificationDate: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ valid: false, message: 'Error verifying certificate' });
  }
};

// Share certificate via email
const shareCertificate = async (req, res) => {
  try {
    const { email, message } = req.body;
    const certificate = await Certificate.findById(req.params.id).populate('course user');
    
    if (!certificate) return res.status(404).json({ message: 'Certificate not found' });

    // Here you would integrate with your email service (Nodemailer, SendGrid, etc.)
    // This is a mock implementation
    const shareData = {
      to: email,
      subject: `Certificate of Completion - ${certificate.course.title}`,
      certificateId: certificate._id,
      studentName: certificate.user.name,
      courseTitle: certificate.course.title,
      customMessage: message
    };

    // Mock email sending
    console.log('Certificate sharing data:', shareData);
    
    res.json({ 
      success: true, 
      message: `Certificate has been shared with ${email}`,
      shareId: uuidv4()
    });
  } catch (error) {
    console.error('Share Certificate Error:', error);
    res.status(500).json({ message: 'Error sharing certificate' });
  }
};

// Export all functions properly
export {
  generateCertificate,
  getUserCertificate,
  getUserCertificates,
  getCertificateById,
  downloadCertificate,
  viewCertificate,
  verifyCertificate,
  shareCertificate
};