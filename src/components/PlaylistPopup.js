import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUpload, FaImage, FaMusic, FaTrash } from 'react-icons/fa';
import './PlaylistPopup.css';

const BASE_URL = process.env.REACT_APP_API_URL;

const PlaylistPopup = ({ isOpen, onClose, song, onPlaylistCreated }) => {
  const [playlists, setPlaylists] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [thumbnailOption, setThumbnailOption] = useState('default');
  const [customThumbnail, setCustomThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchPlaylists();
    }
  }, [isOpen]);

  const fetchPlaylists = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/playlists`);
      if (response.data.success) {
        setPlaylists(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setError('Failed to load playlists');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCustomThumbnail(file);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create the playlist data object
      const playlistData = {
        name: newPlaylistName,
        created_by: 'User'
      };

      // Handle thumbnail based on option
      if (thumbnailOption === 'custom' && customThumbnail) {
        const formData = new FormData();
        formData.append('thumbnail', customThumbnail);
        formData.append('name', newPlaylistName);
        formData.append('created_by', 'User');

        const response = await axios.post(`${BASE_URL}/api/playlists`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success) {
          const newPlaylist = response.data.data;
          handlePlaylistCreated(newPlaylist);
        }
      } else {
        // For default or firstSong option
        if (thumbnailOption === 'firstSong' && song) {
          playlistData.thumbnail = song.thumbnailUrl;
        }

        const response = await axios.post(`${BASE_URL}/api/playlists`, playlistData);

        if (response.data.success) {
          const newPlaylist = response.data.data;
          handlePlaylistCreated(newPlaylist);
        }
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to create playlist. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePlaylistCreated = async (newPlaylist) => {
    setPlaylists([...playlists, newPlaylist]);
    setShowCreateForm(false);
    setNewPlaylistName('');
    setCustomThumbnail(null);
    setThumbnailOption('default');
    
    if (song) {
      await addSongToPlaylist(newPlaylist.id);
    }
    if (onPlaylistCreated) {
      onPlaylistCreated(newPlaylist);
    }
  };

  const addSongToPlaylist = async (playlistId) => {
    try {
      // First check if the song already exists in the playlist
      const playlistResponse = await axios.get(`${BASE_URL}/api/playlists/${playlistId}`);
      if (playlistResponse.data.success) {
        const playlistSongs = playlistResponse.data.data.songs;
        const songExists = playlistSongs.some(s => s.id === song.id);
        
        if (songExists) {
          setError('This song is already in the playlist');
          return;
        }
      }

      // If song doesn't exist, add it
      await axios.post(`${BASE_URL}/api/playlists/${playlistId}/songs/${song.id}`);
      onClose();
    } catch (error) {
      if (error.response && error.response.status === 409) {
        setError('This song is already in the playlist');
      } else {
        console.error('Error adding song to playlist:', error);
        setError('Failed to add song to playlist');
      }
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) {
      return;
    }

    try {
      await axios.delete(`${BASE_URL}/api/playlists/${playlistId}`);
      setPlaylists(playlists.filter(p => p.id !== playlistId));
    } catch (error) {
      console.error('Error deleting playlist:', error);
      setError('Failed to delete playlist');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="playlist-popup-overlay">
      <div className="playlist-popup">
        <button className="close-button" onClick={onClose}>&times;</button>
        <h2>{song ? 'Add to Playlist' : 'Your Playlists'}</h2>
        
        {error && <div className="error-message">{error}</div>}

        {!showCreateForm ? (
          <>
            {playlists.length === 0 ? (
              <p>No playlists yet. Create your first playlist!</p>
            ) : (
              <div className="playlist-list">
                {playlists.map(playlist => (
                  <div
                    key={playlist.id}
                    className="playlist-item"
                  >
                    <div 
                      className="playlist-item-content"
                      onClick={() => song && addSongToPlaylist(playlist.id)}
                    >
                      <img 
                        src={playlist.thumbnailUrl || `${BASE_URL}/thumbnails/default_playlist.jpg`}
                        alt={playlist.name}
                      />
                      <div className="playlist-details">
                        <h3>{playlist.name}</h3>
                        <p>{playlist.song_count || 0} songs</p>
                      </div>
                    </div>
                    <button
                      className="delete-playlist-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlaylist(playlist.id);
                      }}
                      title="Delete playlist"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button 
              className="create-playlist-button"
              onClick={() => setShowCreateForm(true)}
            >
              Create New Playlist
            </button>
          </>
        ) : (
          <form onSubmit={handleCreatePlaylist} className="create-playlist-form">
            <div className="form-group">
              <label>Playlist Name</label>
              <input
                type="text"
                placeholder="Enter playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Playlist Thumbnail</label>
              <div className="thumbnail-options">
                <label className={`thumbnail-option ${thumbnailOption === 'default' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="thumbnailOption"
                    value="default"
                    checked={thumbnailOption === 'default'}
                    onChange={(e) => setThumbnailOption(e.target.value)}
                  />
                  <FaImage />
                  <span>Default</span>
                </label>

                <label className={`thumbnail-option ${thumbnailOption === 'firstSong' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="thumbnailOption"
                    value="firstSong"
                    checked={thumbnailOption === 'firstSong'}
                    onChange={(e) => setThumbnailOption(e.target.value)}
                  />
                  <FaMusic />
                  <span>First Song</span>
                </label>

                <label className={`thumbnail-option ${thumbnailOption === 'custom' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="thumbnailOption"
                    value="custom"
                    checked={thumbnailOption === 'custom'}
                    onChange={(e) => setThumbnailOption(e.target.value)}
                  />
                  <FaUpload />
                  <span>Custom</span>
                </label>
              </div>

              {thumbnailOption === 'custom' && (
                <div className="custom-thumbnail-input">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    id="thumbnail-upload"
                  />
                  <label htmlFor="thumbnail-upload" className="upload-label">
                    <FaUpload />
                    <span>{customThumbnail ? customThumbnail.name : 'Choose image'}</span>
                  </label>
                </div>
              )}
            </div>

            <div className="form-buttons">
              <button 
                type="button" 
                onClick={() => {
                  setShowCreateForm(false);
                  setCustomThumbnail(null);
                  setThumbnailOption('default');
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading || !newPlaylistName.trim() || (thumbnailOption === 'custom' && !customThumbnail)}
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PlaylistPopup; 