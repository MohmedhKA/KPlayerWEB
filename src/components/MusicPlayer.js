import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import { FaPlay, FaPause, FaStepForward, FaStepBackward } from 'react-icons/fa';
import axios from 'axios';
import './MusicPlayer.css';

const BASE_URL = process.env.REACT_APP_API_URL;

const MusicPlayer = ({ currentSong, playlist, onNext, onPrevious }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef(null);
  const progressInterval = useRef(null);
  const progressBarRef = useRef(null);
  const seekTimeout = useRef(null);

  const updateTimeAndProgress = useCallback((seek) => {
    if (!soundRef.current) return;
    
    try {
      const currentSeek = seek ?? soundRef.current.seek();
      const currentDuration = soundRef.current.duration();
      
      if (typeof currentSeek === 'number' && typeof currentDuration === 'number' && currentDuration > 0) {
        setCurrentTime(currentSeek);
        setProgress((currentSeek / currentDuration) * 100);
      }
    } catch (error) {
      console.error('Error updating time and progress:', error);
    }
  }, []);

  const startProgressInterval = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    // Update progress immediately
    updateTimeAndProgress();
    
    // Set up interval for continuous updates
    progressInterval.current = setInterval(() => {
      if (soundRef.current && soundRef.current.playing()) {
        updateTimeAndProgress();
      }
    }, 100);
  }, [updateTimeAndProgress]);

  const stopProgressInterval = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
      console.log('Stopped progress interval');
    }
  }, []);

  const createHowl = useCallback((songUrl) => {
    if (soundRef.current) {
      soundRef.current.unload();
    }
    
    const sound = new Howl({
      src: [songUrl],
      html5: true,
      format: ['mp3'],
      autoplay: true,
      preload: true,
      onload: function() {
        console.log('Song loaded successfully');
        setDuration(this.duration());
        setIsLoading(false);
      },
      onloaderror: (id, error) => {
        console.error('Error loading song:', error);
        setIsLoading(false);
        setIsPlaying(false);
      },
      onplay: () => {
        console.log('Song started playing');
        setIsPlaying(true);
        startProgressInterval();
      },
      onpause: () => {
        console.log('Song paused');
        setIsPlaying(false);
        stopProgressInterval();
      },
      onend: () => {
        console.log('Song ended');
        stopProgressInterval();
        setProgress(0);
        setCurrentTime(0);
        setIsPlaying(false);
        onNext();
      },
      onstop: () => {
        stopProgressInterval();
        setIsPlaying(false);
      },
      onseek: () => {
        updateTimeAndProgress();
      }
    });
    
    return sound;
  }, [onNext, startProgressInterval, stopProgressInterval, updateTimeAndProgress]);

  useEffect(() => {
    const loadSong = async () => {
      if (currentSong) {
        setIsLoading(true);
        // Cleanup previous sound
        if (soundRef.current) {
          soundRef.current.unload();
          soundRef.current = null;
        }
        stopProgressInterval();
        setProgress(0);
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);
//as it is autoplay
        try {
          console.log('Loading song:', currentSong.title);
          const response = await axios.get(`${BASE_URL}/api/music/play/${encodeURIComponent(currentSong.title)}`);
          
          if (response.data.success && response.data.data) {
            let songUrl = `${BASE_URL}/music/${encodeURIComponent(response.data.data.title)}(MP3_320K).mp3`;
            songUrl = songUrl.replace(/%2C/g, '_');
            songUrl = songUrl.replace(/%26/g, '_');
            songUrl = songUrl.replace(/%7C/g, '_');
            
            soundRef.current = createHowl(songUrl);
          }
        } catch (error) {
          console.error('Error loading song:', error);
          setIsLoading(false);
        }
      }
    };

    loadSong();

    return () => {
      if (soundRef.current) {
        soundRef.current.unload();
        soundRef.current = null;
      }
      stopProgressInterval();
      if (seekTimeout.current) {
        clearTimeout(seekTimeout.current);
        seekTimeout.current = null;
      }
    };
  }, [currentSong, createHowl, stopProgressInterval]);

  const togglePlay = () => {
    if (!soundRef.current || isLoading) return;

    try {
      if (soundRef.current.playing()) {
        console.log('Pausing playback');
        soundRef.current.pause();
      } else {
        console.log('Resuming playback');
        soundRef.current.play();
      }
    } catch (error) {
      console.error('Error toggling play:', error);
    }
  };

  const handleNext = () => {
    stopProgressInterval();
    setIsPlaying(false);
    onNext();
  };

  const handlePrevious = () => {
    stopProgressInterval();
    setIsPlaying(false);
    onPrevious();
  };

  const handleSeek = (seekTime) => {
    if (!soundRef.current || typeof seekTime !== 'number') return;
    
    // Clear any existing seek timeout
    if (seekTimeout.current) {
      clearTimeout(seekTimeout.current);
      seekTimeout.current = null;
    }

    try {
      // Stop the current playback to prevent potential audio artifacts
      soundRef.current.pause();
      
      // Seek to the new time
      soundRef.current.seek(seekTime);
      
      // Update current time and progress
      updateTimeAndProgress(seekTime);
      
      // Restart playback if it was playing before
      if (isPlaying) {
        soundRef.current.play();
      }
      
      // Restart progress interval if playing
      if (isPlaying) {
        startProgressInterval();
      }
    } catch (error) {
      console.error('Error during seek:', error);
    }
  };

  const updateProgress = (clientX) => {
    if (!soundRef.current || !progressBarRef.current || isLoading) return;

    const progressBar = progressBarRef.current;
    const rect = progressBar.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(100, (x / width) * 100));
    
    const seekTime = (percentage / 100) * soundRef.current.duration();
    setCurrentTime(seekTime);
    setProgress(percentage);
    return seekTime;
  };

  const handleProgressBarClick = (e) => {
    if (!soundRef.current || isLoading) return;
    
    const seekTime = updateProgress(e.clientX);
    
    // Debounce the seek to prevent multiple rapid seeks
    if (seekTimeout.current) {
      clearTimeout(seekTimeout.current);
    }
    
    seekTimeout.current = setTimeout(() => {
      handleSeek(seekTime);
    }, 100);
  };

  const handleMouseDown = (e) => {
    if (isLoading) return;
    setIsDragging(true);
    updateProgress(e.clientX);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      updateProgress(e.clientX);
    }
  };

  const handleMouseUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      const seekTime = updateProgress(e.clientX);
      
      // Debounce the seek to prevent multiple rapid seeks
      if (seekTimeout.current) {
        clearTimeout(seekTimeout.current);
      }
      
      seekTimeout.current = setTimeout(() => {
        handleSeek(seekTime);
      }, 100);

      // Remove event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="music-player">
      {currentSong && (
        <>
          <div className="song-info">
            <img 
              src={currentSong.thumbnailUrl}
              alt={currentSong.title}
              className="thumbnail"
            />
            <div className="details">
              <div className="marquee-container">
                <div className="marquee-text">
                  {currentSong.title}
                </div>
              </div>
              <p>{currentSong.artist}</p>
            </div>
          </div>
          <div className="controls">
            <button onClick={handlePrevious} disabled={isLoading}>
              <FaStepBackward />
            </button>
            <button onClick={togglePlay} disabled={isLoading}>
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <button onClick={handleNext} disabled={isLoading}>
              <FaStepForward />
            </button>
          </div>
          <div className="progress-container">
            <span className="time">{formatTime(currentTime)}</span>
            <div 
              className="progress-bar" 
              ref={progressBarRef}
              onClick={handleProgressBarClick}
              onMouseDown={handleMouseDown}
            >
              <div 
                className="progress"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="time">{formatTime(duration)}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default MusicPlayer; 