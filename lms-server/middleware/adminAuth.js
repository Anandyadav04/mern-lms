const adminAuth = (req, res, next) => {
  try {
    console.log('Admin auth check - User role:', req.user?.role);
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    console.log('Admin access granted for:', req.user.email);
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error in admin authentication'
    });
  }
};

export default adminAuth;