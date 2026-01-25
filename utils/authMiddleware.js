const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'غير مصرح، يرجى تسجيل الدخول'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // Add user to request
    req.user = user;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      success: false,
      message: 'التوكن غير صالح'
    });
  }
};

module.exports = authMiddleware;
