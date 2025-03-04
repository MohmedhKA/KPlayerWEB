import React from 'react';

//const BASE_URL = process.env.REACT_APP_API_URL;

const SongList = ({ songs, onSongSelect, currentSong }) => {
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="song-list">
      {songs.map((song) => (
        <div
          key={song.id}
          className={`song-item ${currentSong?.id === song.id ? 'active' : ''}`}
          onClick={() => onSongSelect(song)}
        >
          <img
            src={song.thumbnailUrl}
            alt={song.title}
            className="song-thumbnail"
          />
          <div className="song-details">
            <h3 className="song-title">{song.title}</h3>
            <p className="song-artist">{song.artist}</p>
          </div>
          <span className="song-duration">{formatDuration(song.duration)}</span>
        </div>
      ))}
    </div>
  );
};

export default SongList; 