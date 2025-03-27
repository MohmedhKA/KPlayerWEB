import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { FaTimes, FaCloudUploadAlt, FaMusic } from 'react-icons/fa';
import Notification from './Notification';
import './UploadSong.css';

const BASE_URL = process.env.REACT_APP_API_URL;

const UploadSong = ({ onClose, onUploadComplete, onProgress }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [emotion, setEmotion] = useState('');
  const [error, setError] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [showModal, setShowModal] = useState(true);

  const onDrop = useCallback((acceptedFiles) => {
    setSelectedFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/mpeg': ['.mp3'],
      'audio/mp3': ['.mp3']
    },
    multiple: false
  });

  const handleUpload = (e) => {
    e.preventDefault();
    if (!selectedFile || !emotion) {
      setError('Please select a file and emotion');
      return;
    }
    
    setShowNotification(true);
    setShowModal(false);
  };

  const handleNotificationClose = () => {
    setShowNotification(false);
    onClose && onClose();
  };

  const handleUploadComplete = (song) => {
    onUploadComplete && onUploadComplete(song);
  };

  return ReactDOM.createPortal(
    <>
      {showNotification && (
        <Notification
          songFile={selectedFile}
          emotion={emotion}
          onClose={handleNotificationClose}
          onUploadComplete={handleUploadComplete}
        />
      )}
      
      {showModal && (
        <div className="upload-overlay">
          <div className="upload-container">
            <div className="upload-header">
              <h2 className="upload-title">
                <FaMusic /> Add New Song
              </h2>
              <button className="close-button" onClick={() => {
                setShowModal(false);
                onClose && onClose();
              }}>
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
                <option value="Excitement">Excitement 🤩</option>
                <option value="Romantic">Romantic 💖</option>
                <option value="Anger">Anger 😠</option>
              </select>

              {error && <div className="error-message">❌ {error}</div>}

              <button
                type="submit"
                className="upload-button"
                disabled={!selectedFile || !emotion}
              >
                <>🚀 Upload Song</>
              </button>
            </form>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default UploadSong;