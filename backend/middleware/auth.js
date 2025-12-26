const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }
    next();
  };
};

// Check if user can access video
exports.canAccessVideo = async (req, res, next) => {
  try {
    const Video = require('../models/Video');
    const videoId = req.params.id || req.params.videoId;
    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Admin can access all videos
    if (req.user.role === 'admin') {
      req.video = video;
      return next();
    }

    // Check organization match
    if (video.organization !== req.user.organization) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if user uploaded the video or has access
    const isOwner = video.uploadedBy.toString() === req.user._id.toString();
    const hasAccess = video.accessibleBy.some(
      id => id.toString() === req.user._id.toString()
    );

    if (!isOwner && !hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    req.video = video;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};