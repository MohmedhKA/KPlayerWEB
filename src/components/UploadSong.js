import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { FaTimes, FaCloudUploadAlt, FaMusic } from 'react-icons/fa';  // Make sure these are installed
import './UploadSong.css';

const BASE_URL = process.env.REACT_APP_API_URL;

const UploadSong = ({ onClose, onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [emotion, setEmotion] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/mpeg': ['.mp3'],
      'audio/mp3': ['.mp3']
    },
    multiple: false
  });

  const handleUpload = async (e) => {
    e.preventDefault();
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
        },
        onUploadProgress: (progressEvent) => {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          setUploadProgress(progress);
        }
      });

      if (response.data.success) {
        onUploadComplete(response.data.data);
        onClose();
      }
    } catch (error) {
      console.error('Error uploading:', error);
      // Handle duplicate song error specifically
      if (error.response?.status === 409) {
        setError(`A song with title "${error.response.data.existingSong.title}" already exists`);
      } else {
        setError(error.response?.data?.message || 'Upload failed');
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="upload-overlay">
      <div className="upload-container">
        <div className="upload-header">
          <h2 className="upload-title">
            <FaMusic /> Add New Song
          </h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleUpload} className="upload-form">
          <div
            {...getRootProps()}
            className={`upload-dropzone ${isDragActive ? 'dragging' : ''}`}
          >
            <input {...getInputProps()} />
            <FaCloudUploadAlt className="upload-icon" />
            <div className="upload-text">
              {selectedFile ? (
                <>🎵 Selected: {selectedFile.name}</>
              ) : isDragActive ? (
                <>✨ Drop your song here!</>
              ) : (
                <>
                  🎵 Drag & drop your song here
                  <br />
                  <span className="upload-subtext">or click to browse</span>
                </>
              )}
            </div>
          </div>

          <select
            className="emotion-select"
            value={emotion}
            onChange={(e) => setEmotion(e.target.value)}
          >
            <option value="">Select emotion 🎭</option>
            <option value="Joy">Joy 😊</option>
            <option value="Sad">Sad 😢</option>
            <option value="Excitement">Neutral 😑</option>
            <option value="Surprise">Surprise 🤩</option>
            <option value="Anger">Anger 😠</option>
          </select>

          {error && <div className="error-message">❌ {error}</div>}

          {uploading && (
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <button
            type="submit"
            className="upload-button"
            disabled={!selectedFile || !emotion || uploading}
          >
            {uploading ? (
              <>📤 Uploading... {Math.round(uploadProgress)}%</>
            ) : (
              <>🚀 Upload Song</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadSong;