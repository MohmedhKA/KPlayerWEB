import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Howl } from 'howler';
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaVolumeUp, FaVolumeMute, FaPlus } from 'react-icons/fa';
import { FaShuffle } from 'react-icons/fa6';
import axios from 'axios';
import PlaylistPopup from './PlaylistPopup';
import './MusicPlayer.css';

const BASE_URL = process.env.REACT_APP_API_URL;

const MusicPlayer = ({ 
  currentSong, 
  playlist, 
  onNext, 
  onPrevious, 
  isShuffleMode, 
  onShuffleToggle 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlaylistPopup, setShowPlaylistPopup] = useState(false);
  const soundRef = useRef(null);
  const progressInterval = useRef(null);
  const progressBarRef = useRef(null);
  const seekTimeout = useRef(null);
  const previousVolume = useRef(volume);

  const updateTimeAndProgress = useCallback(() => {
    if (!soundRef.current) return;
    
    try {
      const currentSeek = soundRef.current.seek();
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
    
    updateTimeAndProgress();
    
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
    }
  }, []);

  useEffect(() => {
    const loadSong = async () => {
      if (currentSong) {
        setIsLoading(true);
        
        if (soundRef.current) {
          soundRef.current.stop();
          soundRef.current.unload();
        }

        stopProgressInterval();
        setProgress(0);
        setCurrentTime(0);
        setDuration(0);

        try {
          const sound = new Howl({
            src: [currentSong.fileUrl],
            html5: true,
            volume: volume,
            onload: () => {
              setDuration(sound.duration());
              setIsLoading(false);
              sound.play();
            },
            onplay: () => {
              setIsPlaying(true);
              startProgressInterval();
            },
            onpause: () => {
              setIsPlaying(false);
              stopProgressInterval();
            },
            onstop: () => {
              setIsPlaying(false);
              stopProgressInterval();
            },
            onend: () => {
              stopProgressInterval();
              setProgress(0);
              setCurrentTime(0);
              setIsPlaying(false);
              onNext();
            },
            onseek: () => {
              updateTimeAndProgress();
            },
            onloaderror: (id, error) => {
              console.error('Error loading song:', error);
              setIsLoading(false);
              setIsPlaying(false);
            }
          });

          soundRef.current = sound;
        } catch (error) {
          console.error('Error loading song:', error);
          setIsLoading(false);
        }
      }
    };

    loadSong();

    return () => {
      if (soundRef.current) {
        soundRef.current.stop();
        soundRef.current.unload();
      }
      stopProgressInterval();
      if (seekTimeout.current) {
        clearTimeout(seekTimeout.current);
      }
    };
  }, [currentSong, startProgressInterval, stopProgressInterval, updateTimeAndProgress]);

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.volume(volume);
    }
  }, [volume]);

  const handlePlayPause = () => {
    if (!soundRef.current || isLoading) return;

    if (soundRef.current.playing()) {
      soundRef.current.pause();
    } else {
      soundRef.current.play();
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (soundRef.current) {
      soundRef.current.volume(newVolume);
    }
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      setVolume(previousVolume.current);
      if (soundRef.current) {
        soundRef.current.volume(previousVolume.current);
      }
    } else {
      previousVolume.current = volume;
      setVolume(0);
      if (soundRef.current) {
        soundRef.current.volume(0);
      }
    }
    setIsMuted(!isMuted);
  };

  const handleSeek = (seekTime) => {
    if (!soundRef.current || typeof seekTime !== 'number') return;
    
    if (seekTimeout.current) {
      clearTimeout(seekTimeout.current);
    }

    soundRef.current.seek(seekTime);
    updateTimeAndProgress();
  };

  const handleProgressBarClick = (e) => {
    if (!soundRef.current || isLoading) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    const seekTime = (percentage / 100) * soundRef.current.duration();
    
    handleSeek(seekTime);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="music-player">
      <div className="now-playing">
        {currentSong && (
          <>
            <img 
              src={currentSong.thumbnailUrl || `${BASE_URL}/thumbnails/default.jpg`}
              alt={currentSong.title}
              className="current-song-thumbnail"
            />
            <div className="current-song-info">
              <div className="current-song-title">{currentSong.title}</div>
              <div className="current-song-artist">{currentSong.artist}</div>
            </div>
          </>
        )}
      </div>
      <div className="controls">
        <button 
          className="control-button" 
          onClick={onPrevious}
          title="Previous"
        >
          <FaStepBackward />
        </button>
        <button 
          className="control-button play-pause" 
          onClick={handlePlayPause}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        <button 
          className="control-button" 
          onClick={onNext}
          title="Next"
        >
          <FaStepForward />
        </button>
        <button 
          className={`control-button shuffle-button ${isShuffleMode ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onShuffleToggle();
          }}
          title={`Shuffle ${isShuffleMode ? 'On' : 'Off'}`}
        >
          <FaShuffle />
        </button>
      </div>
      <div className="player-center">
        <div className="progress-container">
          <span className="time">{formatTime(currentTime)}</span>
          <div 
            className="progress-bar" 
            ref={progressBarRef}
            onClick={handleProgressBarClick}
          >
            <div 
              className="progress"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="time">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-right">
        {currentSong && (
          <button 
            className="add-to-playlist-button"
            onClick={() => setShowPlaylistPopup(true)}
            title="Add to Playlist"
          >
            <FaPlus />
          </button>
        )}
        <button onClick={handleMuteToggle} className="volume-button">
          {isMuted || volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
      </div>

      {showPlaylistPopup && (
        <PlaylistPopup
          isOpen={showPlaylistPopup}
          onClose={() => setShowPlaylistPopup(false)}
          song={currentSong}
        />
      )}
    </div>
  );
};

export default MusicPlayer;