import React, { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { FaPlay, FaPause, FaStepForward, FaStepBackward } from 'react-icons/fa';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL;

const MusicPlayer = ({ currentSong, playlist, onNext, onPrevious }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const soundRef = useRef(null);
  const progressInterval = useRef(null);

  useEffect(() => {
    const loadSong = async () => {
      if (currentSong) {
        if (soundRef.current) {
          soundRef.current.unload();
        }

        try {
          console.log('Loading song:', currentSong.title);
          const response = await axios.get(`${BASE_URL}/api/music/play/${encodeURIComponent(currentSong.title)}`);
          console.log('Complete API Response:', response.data);
          console.log('Song data:', response.data.data);

          if (response.data.success && response.data.data) {
            // Construct URL using the file location from response
            let songUrl = `${BASE_URL}/music/${encodeURIComponent(response.data.data.title)}(MP3_320K).mp3`;
            // Replace encoded underscores with actual underscores
            songUrl = songUrl.replace(/%2C/g, '_');
            songUrl = songUrl.replace(/%26/g, '_');
            songUrl = songUrl.replace(/%7C/g, '_');
            console.log('Constructed URL:', songUrl);

            soundRef.current = new Howl({
              src: [songUrl],
              html5: true,
              format: ['mp3'],
              onload: () => {
                console.log('Song loaded successfully');
              },
              onloaderror: (id, error) => {
                console.error('Error loading song:', error);
              },
              onplay: () => {
                console.log('Song started playing');
              },
              onend: () => {
                console.log('Song ended');
                onNext();
              },
            });
          } else {
            console.error('Invalid response format:', response.data);
          }
        } catch (error) {
          console.error('Error loading song:', error);
        }
      }
    };

    loadSong();

    return () => {
      if (soundRef.current) {
        soundRef.current.unload();
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentSong, onNext]);

  const togglePlay = () => {
    if (!soundRef.current) return;

    if (isPlaying) {
      soundRef.current.pause();
    } else {
      soundRef.current.play();
    }
    setIsPlaying(!isPlaying);

    if (!isPlaying) {
      progressInterval.current = setInterval(() => {
        if (soundRef.current) {
          setProgress((soundRef.current.seek() / soundRef.current.duration()) * 100);
        }
      }, 1000);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }
  };

  const handleNext = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    setIsPlaying(false);
    onNext();
  };

  const handlePrevious = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    setIsPlaying(false);
    onPrevious();
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
              <h3>{currentSong.title}</h3>
              <p>{currentSong.artist}</p>
            </div>
          </div>
          <div className="controls">
            <button onClick={handlePrevious}>
              <FaStepBackward />
            </button>
            <button onClick={togglePlay}>
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <button onClick={handleNext}>
              <FaStepForward />
            </button>
          </div>
          <div className="progress-bar">
            <div 
              className="progress"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default MusicPlayer; 