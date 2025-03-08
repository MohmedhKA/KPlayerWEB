import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SearchBar from './components/SearchBar';
import SongList from './components/SongList';
import MusicPlayer from './components/MusicPlayer';
import AddSongButton from './components/AddSongButton';
import TabNavigation from './components/TabNavigation';
import PlaylistView from './components/PlaylistView';
import './App.css';

const BASE_URL = process.env.REACT_APP_API_URL;

function App() {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/music`);
      if (response.data.success) {
        setSongs(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
    }
  };

  const handleSongSelect = (song) => {
    const index = songs.findIndex(s => s.id === song.id);
    setCurrentIndex(index);
    setCurrentSong(song);
  };

  const handleNext = () => {
    if (currentIndex < songs.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentSong(songs[nextIndex]);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentSong(songs[prevIndex]);
    }
  };

  const handleSearchResults = (results) => {
    setSongs(results);
    setCurrentSong(null);
    setCurrentIndex(-1);
  };

  const handleSongAdded = (newSong) => {
    setSongs(prevSongs => [...prevSongs, newSong]);
  };

  const handlePlaylistSelect = (playlistSongs) => {
    setSongs(playlistSongs);
    setCurrentSong(null);
    setCurrentIndex(-1);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Music Streaming</h1>
        <SearchBar onSearchResults={handleSearchResults} />
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </header>
      <main className="app-main">
        {activeTab === 'home' ? (
          <SongList
            songs={songs}
            currentSong={currentSong}
            onSongSelect={handleSongSelect}
          />
        ) : (
          <PlaylistView 
            onPlaylistSelect={handlePlaylistSelect}
            currentSong={currentSong}
            onSongSelect={handleSongSelect}
          />
        )}
      </main>
      <footer className="app-footer">
        <MusicPlayer
          currentSong={currentSong}
          playlist={songs}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      </footer>
      <AddSongButton onSongAdded={handleSongAdded} />
    </div>
  );
}

export default App; 