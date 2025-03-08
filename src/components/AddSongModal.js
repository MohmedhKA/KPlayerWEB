import React, { useState, useRef } from 'react';
import axios from 'axios';
import './AddSongModal.css';

const BASE_URL = process.env.REACT_APP_API_URL;

const AddSongModal = ({ isOpen, onClose, onSongAdded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [emotion, setEmotion] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const emotions = ['Surprise', 'Sad', 'Anger', 'Joy','Excitement'];

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type.startsWith('audio/')) {
      setSelectedFile(file);
      setError('');
    } else {
      setError('Please select an audio file');
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !emotion) {
      setError('Please select a file and emotion');
      return;
    }

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('emotion', emotion);

    try {
      const response = await axios.post(`${BASE_URL}/api/music`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        onSongAdded(response.data.data);
        onClose();
      }
    } catch (error) {
      console.error('Upload error:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Error uploading song');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>&times;</button>
        <h2>Add New Song</h2>
        
        <form onSubmit={handleSubmit} className="upload-form">
          <div 
            className={`drop-zone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            {selectedFile ? (
              <div className="selected-file">
                <p>{selectedFile.name}</p>
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="drop-zone-text">
                <p>Drag and drop your audio file here</p>
                <p>or</p>
                <button type="button" className="select-button">
                  Select File
                </button>
              </div>
            )}
          </div>

          <div className="emotion-selector">
            <label>Select Emotion:</label>
            <select 
              value={emotion} 
              onChange={(e) => setEmotion(e.target.value)}
              required
            >
              <option value="">Select an emotion</option>
              {emotions.map((em) => (
                <option key={em} value={em.toLowerCase()}>
                  {em}
                </option>
              ))}
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="submit-button"
            disabled={isUploading || !selectedFile || !emotion}
          >
            {isUploading ? 'Uploading...' : 'Upload Song'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddSongModal; 