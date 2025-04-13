import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { FaTimes, FaCloudUploadAlt, FaMusic } from 'react-icons/fa';
import Notification from './Notification';
import './UploadSong.css';

const BASE_URL = process.env.REACT_APP_API_URL;

const UploadSong = ({ onClose, onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [emotion, setEmotion] = useState('');
  const [error, setError] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [notificationMessage, setNotificationMessage] = useState('');

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

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !emotion) {
      setError('Please select a file and emotion');
      return;
    }

    setShowModal(false);
    setShowNotification(true);
    setUploadStatus('uploading');

    try {
      const formData = new FormData();
      formData.append('song', selectedFile);
      formData.append('emotion', emotion);
      formData.append('timestamp', new Date().getTime());

      const response = await axios.post(`${BASE_URL}/api/music/upload`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Cache-Control': 'no-cache'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      });

      if (response.data.success) {
        setUploadProgress(100);
        setUploadStatus('success');
        onUploadComplete && onUploadComplete(response.data.data);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setNotificationMessage(
        error.response?.status === 409
          ? 'File already exists'
          : error.response?.data?.message || 'Upload failed'
      );
    }
  };

  const handleNotificationClose = () => {
    setShowNotification(false);
    onClose && onClose();
  };

  return ReactDOM.createPortal(
    <>
      {showNotification && (
        <Notification
          message={notificationMessage}
          type={uploadStatus}
          progress={uploadProgress}
          onClose={handleNotificationClose}
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