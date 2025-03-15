import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SearchBar from './components/SearchBar';
import SongList from './components/SongList';
import MusicPlayer from './components/MusicPlayer';
import PlaylistView from './components/PlaylistView';
import UploadSong from './components/UploadSong';
import FacialDetection from './components/FacialDetection';
import WeatherDetection from './components/WeatherDetection';
import './App.css';
import weatherIcon from './assets/weather.png';
import faceIcon from './assets/face.png';

const BASE_URL = process.env.REACT_APP_API_URL;

function App() {
  const [allSongs, setAllSongs] = useState([]);
  const [displayedSongs, setDisplayedSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState('home');
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [slideDirection, setSlideDirection] = useState('right');
  const [showUpload, setShowUpload] = useState(false);
  const [showFacialDetection, setShowFacialDetection] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isShuffleMode, setIsShuffleMode] = useState(false);
  const [showWeatherDetection, setShowWeatherDetection] = useState(false);

  useEffect(() => {
    fetchSongs();
  }, []);

  // Update the space bar handler to toggle play/pause
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault(); // Prevent page scroll
        const musicPlayerRef = document.querySelector('.music-player');
        const playPauseButton = musicPlayerRef?.querySelector('.play-pause-button');
        if (playPauseButton) {
          playPauseButton.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    console.log('showUpload state changed:', showUpload);
  }, [showUpload]);

  const fetchSongs = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/music`);
      if (response.data.success) {
        setAllSongs(response.data.data);
        setDisplayedSongs(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
    }
  };

  const handleSongSelect = (song, shuffledList = null) => {
    const { audioUrl, ...songWithoutAudioUrl } = song;
    let newIndex;
    
    if (shuffledList) {
      setDisplayedSongs(shuffledList);
      newIndex = shuffledList.findIndex(s => s.id === song.id);
    } else if (currentPlaylist) {
      newIndex = displayedSongs.findIndex(s => s.id === song.id);
    } else {
      newIndex = allSongs.findIndex(s => s.id === song.id);
    }
    
    setCurrentIndex(newIndex);
    setCurrentSong(songWithoutAudioUrl);
  };

  // Update the handleNext function to properly handle shuffle
  const handleNext = () => {
    if (!displayedSongs.length) return;
    
    let nextIndex;
    if (isShuffleMode) {
      // Get random index excluding current song
      let possibleIndices = Array.from(
        { length: displayedSongs.length }, 
        (_, i) => i
      ).filter(i => i !== currentIndex);
      
      if (possibleIndices.length === 0) {
        nextIndex = 0; // Reset to start if no other songs
      } else {
        nextIndex = possibleIndices[Math.floor(Math.random() * possibleIndices.length)];
      }
    } else {
      nextIndex = (currentIndex + 1) % displayedSongs.length;
    }
  
    const nextSong = displayedSongs[nextIndex];
    setCurrentIndex(nextIndex);
    setCurrentSong(nextSong);
  };

  const handlePrevious = () => {
    const songs = currentPlaylist ? displayedSongs : allSongs;
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentSong(songs[prevIndex]);
    }
  };

  const handleSearchResults = (results) => {
    setDisplayedSongs(results);
    setCurrentPlaylist(null);
  };

  const handlePlaylistSelect = (playlistSongs) => {
    setDisplayedSongs(playlistSongs);
    setCurrentPlaylist(playlistSongs);
    
    if (currentSong) {
      const newIndex = playlistSongs.findIndex(s => s.id === currentSong.id);
      setCurrentIndex(newIndex >= 0 ? newIndex : -1);
    }
  };

  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setSlideDirection(tab === 'playlists' ? 'left' : 'right');
      setActiveTab(tab);
      if (tab === 'home') {
        setDisplayedSongs(allSongs);
        setCurrentPlaylist(null);
        
        if (currentSong) {
          const newIndex = allSongs.findIndex(s => s.id === currentSong.id);
          setCurrentIndex(newIndex >= 0 ? newIndex : -1);
        }
      }
    }
  };

  const handleUploadComplete = (newSong) => {
    setAllSongs(prev => [...prev, newSong]);
    if (!currentPlaylist) {
      setDisplayedSongs(prev => [...prev, newSong]);
    }
  };

  const handleEmotionDetected = (emotion) => {
    const filteredSongs = allSongs.filter(song => song.emotion === emotion);
    setDisplayedSongs(filteredSongs);
    setShowFacialDetection(false);
    setActiveTab('home');
  };

  const handleWeatherEmotion = (emotion) => {
    const filteredSongs = allSongs.filter(song => song.emotion === emotion);
    setDisplayedSongs(filteredSongs);
    setShowWeatherDetection(false);
    setActiveTab('home');
  };

  // Add console log to debug shuffle mode toggle
  const toggleShuffleMode = () => {
    console.log('Toggling shuffle mode:', !isShuffleMode);
    setIsShuffleMode(!isShuffleMode);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <span>K</span>
          <span className="player-text">Player</span>
        </h1>
        
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => handleTabChange('home')}
          >
            Home
          </button>
          <button
            className={`tab-button ${activeTab === 'expression' ? 'active' : ''}`}
            onClick={() => handleTabChange('expression')}
          >
            Expression
          </button>
          <button
            className={`tab-button ${activeTab === 'playlists' ? 'active' : ''}`}
            onClick={() => handleTabChange('playlists')}
          >
            Playlists
          </button>
        </div>

        <div className="search-container">
          <SearchBar onSearchResults={handleSearchResults} />
        </div>
      </header>

      <main className="app-main">
        <div className="tab-container">
          <div 
            className={`tab-content ${activeTab === 'home' ? 'active' : ''}`}
            data-tab="home"
          >
            <SongList
              songs={displayedSongs}
              currentSong={currentSong}
              onSongSelect={(song, shuffledList) => handleSongSelect(song, shuffledList)}
            />
          </div>
          <div 
            className={`tab-content ${activeTab === 'expression' ? 'active' : ''}`}
            data-tab="expression"
          >
            <div className="expression-options">
              <button 
                className="expression-option weather"
                onClick={() => setShowWeatherDetection(true)}
              >
                <img src={weatherIcon} alt="Weather" />
                <span>Weather</span>
              </button>
              <button 
                className="expression-option facial"
                onClick={() => setShowFacialDetection(true)}
              >
                <img src={faceIcon} alt="Facial Detection" />
                <span>Facial Detection</span>
              </button>
            </div>
          </div>
          <div 
            className={`tab-content ${activeTab === 'playlists' ? 'active' : ''}`}
            data-tab="playlists"
          >
            <PlaylistView 
              onPlaylistSelect={handlePlaylistSelect}
              currentSong={currentSong}
              onSongSelect={handleSongSelect}
            />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <MusicPlayer
          currentSong={currentSong}
          playlist={displayedSongs}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isShuffleMode={isShuffleMode}
          onShuffleToggle={toggleShuffleMode}
        />
      </footer>

      <button 
        className="upload-fab"
        onClick={() => {
          console.log('FAB clicked');
          setShowUpload(true);
        }}
        aria-label="Upload song"
      >
        +
      </button>

      {showUpload && (
        <div onClick={(e) => e.stopPropagation()}>
          <UploadSong
            onUploadComplete={handleUploadComplete}
            onClose={() => setShowUpload(false)}
          />
        </div>
      )}

      {showFacialDetection && (
        <div className="facial-detection-overlay">
          <FacialDetection onEmotionDetected={handleEmotionDetected} />
          <button 
            className="close-detection"
            onClick={() => setShowFacialDetection(false)}
          >
            ×
          </button>
        </div>
      )}

      {showWeatherDetection && (
        <WeatherDetection 
          onEmotionDetected={handleWeatherEmotion}
          onClose={() => setShowWeatherDetection(false)}
        />
      )}
    </div>
  );
}

export default App;