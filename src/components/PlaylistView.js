import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlay, FaPause, FaTrash } from 'react-icons/fa';
import { FaShuffle } from 'react-icons/fa6';
import './PlaylistView.css';
import api from '../utils/api';

const BASE_URL = process.env.REACT_APP_API_URL;

const EMOTION_PLAYLISTS = [
  { id: 'romantic', name: 'Romantic', emotion: 'Romantic', thumbnail: 'Romantic_playlist.jpg' },
  { id: 'sad', name: 'Sad', emotion: 'Sad', thumbnail: 'Sad_playlist.jpg' },
  { id: 'anger', name: 'Anger', emotion: 'Anger', thumbnail: 'Anger_playlist.jpg' },
  { id: 'joy', name: 'Joy', emotion: 'Joy', thumbnail: 'Joy_playlist.jpg' },
  { id: 'excitement', name: 'Excitement', emotion: 'Excitement', thumbnail: 'Excitement_playlist.jpg' }
];

// Update the color mapping
const EMOTION_COLORS = {
  Romantic: '#FF69B4', // Pink color for Romantic
  Sad: '#4169E1',     // Royal blue
  Anger: '#FF3838',   // Bright red
  Joy: '#50C878',     // Emerald green
  Excitement: '#E4D00A' // Yellow for Excitement
};

const PlaylistView = ({ onPlaylistSelect, currentSong, onSongSelect }) => {
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistSongs, setPlaylistSongs] = useState({});
  const [showSongs, setShowSongs] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [activeTab, setActiveTab] = useState('emotion'); // 'emotion' or 'user'

  useEffect(() => {
    EMOTION_PLAYLISTS.forEach(fetchPlaylistSongs);
    fetchUserPlaylists();
  }, []);

  // Add a new useEffect to fetch playlists when tab changes
  useEffect(() => {
    if (activeTab === 'user') {
      fetchUserPlaylists();
    }
  }, [activeTab]);

  const fetchUserPlaylists = async () => {
    try {
      const response = await api.get('/api/playlists');
      if (response.data.success) {
        const playlists = response.data.data;
        setUserPlaylists(playlists);
        
        // Fetch songs for each playlist using api instance
        playlists.forEach(async (playlist) => {
          try {
            const songsResponse = await api.get(`/api/playlists/${playlist.id}`);
            if (songsResponse.data.success) {
              setPlaylistSongs(prev => ({
                ...prev,
                [playlist.id]: songsResponse.data.data.songs
              }));
            }
          } catch (error) {
            console.error(`Error fetching songs for playlist ${playlist.name}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching user playlists:', error);
    }
  };

  const fetchPlaylistSongs = async (emotion) => {
    try {
      const response = await api.get('/api/music', {
        params: { playlist: emotion }
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error(`Error fetching songs for playlist ${emotion}:`, error);
      return [];
    }
  };

  const handlePlaylistClick = async (playlist) => {
    setSelectedPlaylist(playlist);
    setShowSongs(true);
    
    try {
      if (playlist.emotion) {
        // Emotion playlist
        const response = await api.get('/api/music', {
          params: { emotion: playlist.emotion }
        });
        if (response.data.success) {
          const songs = response.data.data;
          setPlaylistSongs(prev => ({
            ...prev,
            [playlist.id]: songs
          }));
          onPlaylistSelect(songs);
        }
      } else {
        // User playlist
        const response = await api.get(`/api/playlists/${playlist.id}`);
        if (response.data.success) {
          const songs = response.data.data.songs;
          setPlaylistSongs(prev => ({
            ...prev,
            [playlist.id]: songs
          }));
          onPlaylistSelect(songs);
        }
      }
    } catch (error) {
      console.error('Error fetching playlist songs:', error);
    }
  };

  const handleRemoveSong = async (songId) => {
    if (!selectedPlaylist || selectedPlaylist.emotion) return;
    
    if (!window.confirm('Are you sure you want to remove this song from the playlist?')) {
      return;
    }

    try {
      await axios.delete(`${BASE_URL}/api/playlists/${selectedPlaylist.id}/songs/${songId}`);
      
      // Update the songs list
      const updatedSongs = playlistSongs[selectedPlaylist.id].filter(song => song.id !== songId);
      setPlaylistSongs(prev => ({
        ...prev,
        [selectedPlaylist.id]: updatedSongs
      }));
      onPlaylistSelect(updatedSongs);

      // Update the playlist in userPlaylists
      const updatedPlaylists = userPlaylists.map(p => {
        if (p.id === selectedPlaylist.id) {
          return { ...p, song_count: (p.song_count || 1) - 1 };
        }
        return p;
      });
      setUserPlaylists(updatedPlaylists);
    } catch (error) {
      console.error('Error removing song from playlist:', error);
    }
  };

  const handleBackClick = () => {
    setShowSongs(false);
    setSelectedPlaylist(null);
  };

  const handleSongClick = (song) => {
    onSongSelect(song);
  };

  if (showSongs && selectedPlaylist) {
    const songs = playlistSongs[selectedPlaylist.id] || [];
    const emotionColor = selectedPlaylist.emotion ? EMOTION_COLORS[selectedPlaylist.emotion] : '#1db954';
    
    return (
      <div className="playlist-view">
        <div 
          className="playlist-header"
          style={{
            background: `linear-gradient(180deg, ${emotionColor}22 0%, transparent 100%)`
          }}
        >
          <button className="back-button" onClick={handleBackClick}>
            <span className="back-icon">←</span>
            <span className="back-text">Back</span>
          </button>
          <div className="playlist-title-wrapper">
            <h2 style={{ color: emotionColor, marginRight: '2rem' }}>{selectedPlaylist.name}</h2>
            <div className="playlist-stats">
              <span className="song-count">{songs.length} songs</span>
              <button 
                className="shuffle-all-button"
                onClick={() => {
                  const shuffledSongs = [...songs].sort(() => Math.random() - 0.5);
                  onSongSelect(shuffledSongs[0], shuffledSongs);
                }}
              >
                <FaShuffle />
                <span>Shuffle All</span>
              </button>
            </div>
          </div>
        </div>
        <div className="playlist-songs">
          {songs.map((song, index) => (
            <div 
              key={song.id} 
              className={`song-item ${currentSong?.id === song.id ? 'playing' : ''}`}
            >
              <div 
                className="song-item-content"
                onClick={() => handleSongClick(song)}
              >
                <div className="song-number">
                  {currentSong?.id === song.id ? (
                    <FaPlay className="playing-icon" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="song-thumbnail">
                  <img src={song.thumbnailUrl || `${BASE_URL}/thumbnails/default.jpg`} alt={song.title} />
                </div>
                <div className="song-info">
                  <div className="song-title">{song.title}</div>
                  <div className="song-artist">{song.artist}</div>
                </div>
              </div>
              {!selectedPlaylist.emotion && (
                <button
                  className="remove-song-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSong(song.id);
                  }}
                  title="Remove from playlist"
                >
                  <FaTrash />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="playlist-view">
      <div className="playlist-tabs">
        <button 
          className={`tab-button ${activeTab === 'emotion' ? 'active' : ''}`}
          onClick={() => setActiveTab('emotion')}
        >
          Emotion Playlists
        </button>
        <button 
          className={`tab-button ${activeTab === 'user' ? 'active' : ''}`}
          onClick={() => setActiveTab('user')}
        >
          Your Playlists
        </button>
      </div>

      <div className="playlists-grid">
        {activeTab === 'emotion' ? (
          EMOTION_PLAYLISTS.map((playlist) => (
            <div
              key={playlist.id}
              className={`playlist-card ${selectedPlaylist?.id === playlist.id ? 'selected' : ''}`}
              onClick={() => handlePlaylistClick(playlist)}
            >
              <div className="playlist-image">
                <img 
                  src={`${BASE_URL}/thumbnails/${playlist.thumbnail}`}
                  alt={playlist.name}
                />
              </div>
              <div className="playlist-info">
                <h3>{playlist.name}</h3>
                <p>{(playlistSongs[playlist.id] || []).length} songs</p>
              </div>
            </div>
          ))
        ) : (
          // User Playlists
          userPlaylists.map((playlist) => (
            <div
              key={playlist.id}
              className={`playlist-card ${selectedPlaylist?.id === playlist.id ? 'selected' : ''}`}
              onClick={() => handlePlaylistClick(playlist)}
            >
              <div className="playlist-image">
                <img 
                  src={playlist.thumbnailUrl || `${BASE_URL}/thumbnails/default_playlist.jpg`}
                  alt={playlist.name}
                />
              </div>
              <div className="playlist-info">
                <h3>{playlist.name}</h3>
                <p>{playlist.song_count || 0} songs</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PlaylistView;