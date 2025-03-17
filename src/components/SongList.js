import React, { useState } from 'react';
import { FaPlay, FaTrash } from 'react-icons/fa';
import { FaShuffle } from 'react-icons/fa6';
import axios from 'axios';
import './SongList.css';

const BASE_URL = process.env.REACT_APP_API_URL;

const SongList = ({ songs, currentSong, onSongSelect, onSongDeleted, onShuffleToggle }) => {
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const handleSongSelect = (song) => {
    console.log('Selected song:', song);
    onSongSelect(song);
  };

  const handleDeleteSong = async (songId, event) => {
    event.stopPropagation(); // Prevent song selection when clicking delete

    if (!window.confirm('Are you sure you want to delete this song? This will remove the song file from the server.')) {
      return;
    }

    setDeletingId(songId);
    setError('');

    try {
      console.log('Deleting song with ID:', songId);
      const response = await axios.delete(`${BASE_URL}/api/music/${songId}`);
      
      if (response.data.success) {
        console.log('Song deleted successfully:', response.data);
        // If onSongDeleted callback exists, call it to update the UI
        if (onSongDeleted) {
          onSongDeleted(songId);
        } else {
          // Fallback to page reload if no callback provided
          window.location.reload();
        }
      } else {
        setError('Failed to delete song: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting song:', error);
      setError('Failed to delete song: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeletingId(null);
    }
  };

  const handleShuffle = () => {
    // Don't modify the song order in home page
    const shuffledSongs = [...songs].sort(() => Math.random() - 0.5);
    
    // Play the first song without affecting the original list
    if (shuffledSongs.length > 0) {
      onSongSelect(shuffledSongs[0]);
    }
  };

  const formatDuration = (duration) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (songs.length === 0) {
    return <div className="no-songs">No songs found</div>;
  }

  return (
    <div className="song-list">
      {error && <div className="error-message">{error}</div>}
      {songs.length > 0 && (
        <div className="shuffle-container">
          <button className="shuffle-button" onClick={handleShuffle}>
            <FaShuffle />
            <span>Shuffle Play</span>
          </button>
        </div>
      )}
      {songs.map((song, index) => {
        // Ensure thumbnail URL is set
        if (!song.thumbnailUrl) {
          song.thumbnailUrl = `${BASE_URL}/thumbnails/default.jpg`;
        }
        
        return (
          <div
            key={song.id}
            className={`song-item ${currentSong?.id === song.id ? 'playing' : ''} ${deletingId === song.id ? 'deleting' : ''}`}
            onClick={() => handleSongSelect(song)}
          >
            <div className="song-item-content">
              <div className="song-number">
                {currentSong?.id === song.id ? (
                  <FaPlay className="playing-icon" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="song-thumbnail">
                <img 
                  src={song.thumbnailUrl}
                  alt={song.title}
                  onError={(e) => {
                    console.log('Thumbnail load error for song:', song.title);
                    e.target.onerror = null;
                    e.target.src = `${BASE_URL}/thumbnails/default.jpg`;
                  }}
                />
              </div>
              <div className="song-info">
                <div className="song-title">{song.title}</div>
                <div className="song-artist">{song.artist}</div>
              </div>
              <div className="song-duration">
                {formatDuration(song.duration)}
              </div>
            </div>
            <button
              className={`delete-song-button ${deletingId === song.id ? 'deleting' : ''}`}
              onClick={(e) => handleDeleteSong(song.id, e)}
              title="Delete song"
              disabled={deletingId === song.id}
            >
              <FaTrash />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default SongList;