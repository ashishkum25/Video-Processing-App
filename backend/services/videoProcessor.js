const ffmpeg = require('fluent-ffmpeg');
const Video = require('../models/Video');

class VideoProcessor {
  constructor(io) {
    this.io = io;
  }

  // Process video for metadata and sensitivity analysis
  async processVideo(videoId) {
    try {
      const video = await Video.findById(videoId);
      if (!video) throw new Error('Video not found');

      // Update status to processing
      video.status = 'processing';
      video.processingProgress = 0;
      await video.save();

      this.emitProgress(videoId, 0, 'Starting video processing...');

      // Extract video metadata
      await this.extractMetadata(video);
      this.emitProgress(videoId, 30, 'Metadata extracted...');

      // Simulate sensitivity analysis
      await this.analyzeSensitivity(video);
      this.emitProgress(videoId, 70, 'Sensitivity analysis complete...');

      // Finalize processing
      video.status = 'completed';
      video.processingProgress = 100;
      await video.save();

      this.emitProgress(videoId, 100, 'Processing complete!');

      return video;
    } catch (error) {
      console.error('Video processing error:', error);
      
      const video = await Video.findById(videoId);
      if (video) {
        video.status = 'failed';
        await video.save();
      }

      this.emitProgress(videoId, 0, 'Processing failed', true);
      throw error;
    }
  }

  // Extract video metadata using ffmpeg
  extractMetadata(video) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(video.filepath, async (err, metadata) => {
        if (err) return reject(err);

        try {
          const duration = metadata.format.duration || 0;
          video.duration = Math.round(duration);
          await video.save();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  // Simulate sensitivity analysis
  async analyzeSensitivity(video) {
    // Simulate processing time
    await this.delay(2000);

    // Simple heuristic-based sensitivity scoring
    // In production, use ML model or external API
    const score = Math.random() * 100;
    const threshold = 70;

    video.sensitivityScore = score;
    video.sensitivityStatus = score >= threshold ? 'flagged' : 'safe';
    
    await video.save();
  }

  // Emit progress via Socket.io
  emitProgress(videoId, progress, message, error = false) {
    this.io.emit('videoProgress', {
      videoId,
      progress,
      message,
      error,
      timestamp: new Date()
    });
  }

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = VideoProcessor;