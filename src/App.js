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

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'; // Add fallback URL

function App() {
  const [allSongs, setAllSongs] = useState([]);
  const [displayedSongs, setDisplayedSongs] = useState([]);
  const [recommendedSongs, setRecommendedSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState('home');
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [slideDirection, setSlideDirection] = useState('right');
  const [showUpload, setShowUpload] = useState(false);
  const [showFacialDetection, setShowFacialDetection] = useState(false);
  const [isShuffleMode, setIsShuffleMode] = useState(false);
  const [showWeatherDetection, setShowWeatherDetection] = useState(false);
  const [homeSongs, setHomeSongs] = useState([]); // Add this new state

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/music`); // Update endpoint path
        if (response.data.success) {
          const songs = response.data.data;
          setAllSongs(songs);
          setHomeSongs(songs);  // Set home songs
          setDisplayedSongs(songs);
        }
      } catch (error) {
        console.error('Error fetching songs:', error);
      }
    };

    fetchSongs();
  }, []);

  // Modify the space bar handler in useEffect
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault(); // Prevent page scroll
        const playPauseButton = document.querySelector('.play-pause');
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

  // Update the handleSongSelect function
  const handleSongSelect = (song, shuffledList = null, enableShuffle = false) => {
    const { audioUrl, ...songWithoutAudioUrl } = song;
    let newIndex = allSongs.findIndex(s => s.id === song.id);
    
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
    if (activeTab === 'home') {
      setHomeSongs(results);
    }
    setDisplayedSongs(results);
    // Don't modify recommendedSongs here
  };

  const handlePlaylistSelect = (playlistSongs) => {
    setDisplayedSongs(playlistSongs);
    setCurrentPlaylist(playlistSongs);
    
    if (currentSong) {
      const newIndex = playlistSongs.findIndex(s => s.id === currentSong.id);
      setCurrentIndex(newIndex >= 0 ? newIndex : -1);
    }
  };

  // Update the handleTabChange function
  const handleTabChange = (tab) => {
    // Set slide direction based on current and new tab
    const currentIndex = ['home', 'playlists', 'advanced'].indexOf(activeTab);
    const newIndex = ['home', 'playlists', 'advanced'].indexOf(tab);
    setSlideDirection(newIndex > currentIndex ? 'right' : 'left');
    
    // Restore home songs when switching to home tab
    if (tab === 'home') {
      setDisplayedSongs(homeSongs);
    }
    
    // Set the new active tab
    setActiveTab(tab);

    // Toggle the class for Advanced tab
    const appElement = document.querySelector('.app');
    if (appElement) {
      if (tab === 'advanced') {
        appElement.classList.add('advanced-active');
      } else {
        appElement.classList.remove('advanced-active');
      }
    }

    // Reset scroll position of app-main
    const mainContent = document.querySelector('.app-main');
    if (mainContent) {
      mainContent.scrollTo({
        top: 0,
        behavior: 'instant' // Use 'smooth' for animated scroll
      });
    }
  };

  const handleUploadComplete = (newSong) => {
    setAllSongs(prev => [...prev, newSong]);
    setHomeSongs(prev => [...prev, newSong]); // Add to home songs
    if (!currentPlaylist && activeTab === 'home') {
      setDisplayedSongs(prev => [...prev, newSong]);
    }
  };

  // First, modify the handleEmotionDetected function:
  const handleEmotionDetected = (emotion) => {
    const filteredSongs = allSongs.filter(song => song.emotion === emotion);
    setRecommendedSongs(filteredSongs);
    setDisplayedSongs(filteredSongs); // Add this line
    setShowFacialDetection(false);
  };

  // Remove the setActiveTab('home') call from handleWeatherEmotion
  const handleWeatherEmotion = (emotion) => {
    const filteredSongs = allSongs.filter(song => song.emotion === emotion);
    setRecommendedSongs(filteredSongs);
    setDisplayedSongs(filteredSongs); // Add this line
    setShowWeatherDetection(false);
  };

  // Add console log to debug shuffle mode toggle
  const toggleShuffleMode = () => {
    console.log('Toggling shuffle mode:', !isShuffleMode);
    setIsShuffleMode(!isShuffleMode);
  };

  // Add this new function after other handler functions
  const handleBackToExpressionOptions = () => {
    setRecommendedSongs([]);
    setDisplayedSongs(homeSongs);
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
            className={`tab-button ${activeTab === 'advanced' ? 'active' : ''}`}
            onClick={() => handleTabChange('advanced')}
          >
            Advanced
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
          {/* Home tab - shows all songs */}
          <div 
            className={`tab-content ${activeTab === 'home' ? 'active' : ''}`}
            data-tab="home"
          >
            <SongList
              songs={homeSongs}
              currentSong={currentSong}
              onSongSelect={(song, shuffledList) => handleSongSelect(song, shuffledList)}
            />
          </div>

          {/* Expression tab - shows recommended songs */}
          <div 
            className={`tab-content ${activeTab === 'advanced' ? 'active' : ''}`}
            data-tab="advanced"
          >
            {!showFacialDetection && !showWeatherDetection ? (
              <>
                {recommendedSongs.length > 0 ? (
                  <div className="expression-songs">
                    <button 
                      className="back-button"
                      onClick={handleBackToExpressionOptions}
                    >
                      ← Back
                    </button>
                    <h2>Recommended Songs</h2>
                    <div className="song-recommendation-info">
                      <p>Based on your mood</p>
                    </div>
                    <SongList
                      songs={recommendedSongs}
                      currentSong={currentSong}
                      onSongSelect={(song, shuffledList) => handleSongSelect(song, shuffledList)}
                    />
                  </div>
                ) : (
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
                )}
              </>
            ) : null}
            
            {/* Rest of the expression tab content... */}
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