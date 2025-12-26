const express = require('express');
const fs = require('fs');
const path = require('path');
const Video = require('../models/Video');
const { authenticate, authorize, canAccessVideo } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Upload video
router.post('/upload', 
  authenticate, 
  authorize('editor', 'admin'),
  upload.single('video'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No video file provided' });
      }

      const { title, description, tags } = req.body;

      const video = new Video({
        title: title || req.file.originalname,
        description: description || '',
        filename: req.file.filename,
        filepath: req.file.path,
        filesize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: req.user._id,
        organization: req.user.organization,
        tags: tags ? JSON.parse(tags) : [],
        status: 'processing'
      });

      await video.save();

      // Trigger video processing (async)
      const VideoProcessor = require('../services/videoProcessor');
      const io = req.app.get('io');
      const processor = new VideoProcessor(io);
      processor.processVideo(video._id).catch(console.error);

      res.status(201).json({
        message: 'Video uploaded successfully',
        video: {
          id: video._id,
          title: video.title,
          status: video.status,
          uploadedAt: video.createdAt
        }
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ 
        message: 'Upload failed', 
        error: error.message 
      });
    }
  }
);

// Get all videos (with filters)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, sensitivityStatus, page = 1, limit = 10 } = req.query;

    // Build query based on user role
    let query = {};

    if (req.user.role === 'admin') {
      // Admin sees all videos
      query = {};
    } else {
      // Others see only their organization's videos
      query.organization = req.user.organization;
      
      // Viewers see only videos they have access to
      if (req.user.role === 'viewer') {
        query.$or = [
          { uploadedBy: req.user._id },
          { accessibleBy: req.user._id }
        ];
      }
    }

    // Apply filters
    if (status) query.status = status;
    if (sensitivityStatus) query.sensitivityStatus = sensitivityStatus;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const videos = await Video.find(query)
      .populate('uploadedBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Video.countDocuments(query);

    res.json({
      videos,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch videos', 
      error: error.message 
    });
  }
});

// Get single video
router.get('/:id', authenticate, canAccessVideo, async (req, res) => {
  try {
    const video = await req.video.populate('uploadedBy', 'username email');
    res.json({ video });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch video', 
      error: error.message 
    });
  }
});

// Stream video with range requests
router.get('/:id/stream', authenticate, canAccessVideo, async (req, res) => {
  try {
    const video = req.video;
    const videoPath = video.filepath;
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });

      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': video.mimeType
      };

      res.writeHead(206, headers);
      file.pipe(res);
    } else {
      // No range, send entire file
      const headers = {
        'Content-Length': fileSize,
        'Content-Type': video.mimeType
      };

      res.writeHead(200, headers);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    res.status(500).json({ 
      message: 'Streaming failed', 
      error: error.message 
    });
  }
});

// Update video
router.patch('/:id', 
  authenticate, 
  authorize('editor', 'admin'),
  canAccessVideo,
  async (req, res) => {
    try {
      const { title, description, tags } = req.body;
      const video = req.video;

      if (title) video.title = title;
      if (description) video.description = description;
      if (tags) video.tags = tags;

      await video.save();

      res.json({
        message: 'Video updated successfully',
        video
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Update failed', 
        error: error.message 
      });
    }
  }
);

// Delete video
router.delete('/:id',
  authenticate,
  authorize('editor', 'admin'),
  canAccessVideo,
  async (req, res) => {
    try {
      const video = req.video;

      // Delete file from filesystem
      if (fs.existsSync(video.filepath)) {
        fs.unlinkSync(video.filepath);
      }

      // Delete from database
      await Video.findByIdAndDelete(video._id);

      res.json({ message: 'Video deleted successfully' });
    } catch (error) {
      res.status(500).json({ 
        message: 'Deletion failed', 
        error: error.message 
      });
    }
  }
);

module.exports = router;