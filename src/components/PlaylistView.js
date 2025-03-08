import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlay, FaPause } from 'react-icons/fa';
import './PlaylistView.css';

const BASE_URL = process.env.REACT_APP_API_URL;

const EMOTION_PLAYLISTS = [
  { id: 'surprise', name: 'Surprise', emotion: 'Surprise' },
  { id: 'sad', name: 'Sad', emotion: 'Sad' },
  { id: 'anger', name: 'Anger', emotion: 'Anger' },
  { id: 'joy', name: 'Joy', emotion: 'Joy' },
  { id: 'excitement', name: 'Excitement', emotion: 'Excitement' }
];

const PlaylistView = ({ onPlaylistSelect, currentSong, onSongSelect }) => {
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistSongs, setPlaylistSongs] = useState({});
  const [showSongs, setShowSongs] = useState(false);

  useEffect(() => {
    EMOTION_PLAYLISTS.forEach(fetchPlaylistSongs);
  }, []);

  const fetchPlaylistSongs = async (playlist) => {
    try {
      console.log(`Fetching songs for emotion: ${playlist.emotion}`);
      const response = await axios.get(`${BASE_URL}/api/music?emotion=${playlist.emotion}`);
      console.log(`Response for ${playlist.emotion}:`, response.data);
      
      if (response.data.success) {
        setPlaylistSongs(prev => ({
          ...prev,
          [playlist.id]: response.data.data
        }));
      }
    } catch (error) {
      console.error(`Error fetching songs for ${playlist.emotion}:`, error);
    }
  };

  const handlePlaylistClick = async (playlist) => {
    console.log('Playlist clicked:', playlist);
    setSelectedPlaylist(playlist);
    setShowSongs(true);
    
    try {
      console.log(`Fetching songs for selected emotion: ${playlist.emotion}`);
      const response = await axios.get(`${BASE_URL}/api/music?emotion=${playlist.emotion}`);
      console.log('Playlist songs response:', response.data);
      
      if (response.data.success) {
        const songs = response.data.data;
        setPlaylistSongs(prev => ({
          ...prev,
          [playlist.id]: songs
        }));
        onPlaylistSelect(songs);
      }
    } catch (error) {
      console.error('Error fetching playlist songs:', error);
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
    return (
      <div className="playlist-view">
        <div className="playlist-header">
          <button className="back-button" onClick={handleBackClick}>
            ← Back to Playlists
          </button>
          <h2>{selectedPlaylist.name} Playlist</h2>
          <p>{songs.length} songs</p>
        </div>
        <div className="playlist-songs">
          {songs.map((song, index) => (
            <div 
              key={song.id} 
              className={`song-item ${currentSong?.id === song.id ? 'playing' : ''}`}
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
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="playlist-view">
      <h2>Emotion Playlists</h2>
      <div className="playlists-grid">
        {EMOTION_PLAYLISTS.map((playlist) => (
          <div
            key={playlist.id}
            className={`playlist-card ${selectedPlaylist?.id === playlist.id ? 'selected' : ''}`}
            onClick={() => handlePlaylistClick(playlist)}
          >
            <div className="playlist-image">
              <img 
                src={`${BASE_URL}/thumbnails/default_playlist.jpg`}
                alt={playlist.name}
              />
            </div>
            <div className="playlist-info">
              <h3>{playlist.name}</h3>
              <p>{(playlistSongs[playlist.id] || []).length} songs</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaylistView; 