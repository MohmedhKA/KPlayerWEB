import React, { useState, useRef } from 'react';
import axios from 'axios';
import './UploadSong.css';

const BASE_URL = process.env.REACT_APP_API_URL;

const UploadSong = ({ onUploadComplete, onClose }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [emotion, setEmotion] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const emotions = ['Joy', 'Sad', 'Anger', 'Excitement', 'Surprise'];

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      setSelectedFile(file);
      setError('');
    } else {
      setError('Please select an audio file');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      setSelectedFile(file);
      setError('');
    } else {
      setError('Please select an audio file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !emotion) {
      setError('Please select a file and emotion');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('song', selectedFile);
    formData.append('emotion', emotion);

    try {
      const response = await axios.post(`${BASE_URL}/api/music/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        onUploadComplete(response.data.data);
        onClose();
      }
    } catch (error) {
      if (error.response?.status === 409) {
        setError('This song already exists in the library');
      } else {
        setError('Error uploading song. Please try again.');
      }
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-overlay">
      <div className="upload-modal">
        <button className="close-button" onClick={onClose}>×</button>
        
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="audio/*"
            style={{ display: 'none' }}
          />
          {selectedFile ? (
            <div className="selected-file">
              <span className="file-name">{selectedFile.name}</span>
              <button 
                className="remove-file"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <div className="drop-text">
              <p>Drag & drop your song here</p>
              <p>or click to select</p>
            </div>
          )}
        </div>

        <div className="emotion-selector">
          <label>Select Emotion:</label>
          <select 
            value={emotion} 
            onChange={(e) => setEmotion(e.target.value)}
            className="emotion-select"
          >
            <option value="">Choose emotion...</option>
            {emotions.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          className="upload-button"
          onClick={handleUpload}
          disabled={!selectedFile || !emotion || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Song'}
        </button>
      </div>
    </div>
  );
};

export default UploadSong; 