import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { FaTimes } from 'react-icons/fa';
import './Notification.css';

const BASE_URL = process.env.REACT_APP_API_URL;

const Notification = ({ songFile, emotion, onClose, onUploadComplete }) => {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(true);
  const closeTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const uploadAttemptedRef = useRef(false);

  useEffect(() => {
    const uploadSong = async () => {
      // Prevent multiple upload attempts
      if (uploadAttemptedRef.current) return;
      uploadAttemptedRef.current = true;

      try {
        const formData = new FormData();
        formData.append('song', songFile);
        formData.append('emotion', emotion);

        // Add a unique identifier to prevent duplicate uploads
        const timestamp = new Date().getTime();
        formData.append('timestamp', timestamp);

        const response = await axios.post(`${BASE_URL}/api/music/upload`, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Cache-Control': 'no-cache'
          },
          onUploadProgress: (progressEvent) => {
            if (isMountedRef.current && progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setProgress(percentCompleted);
            }
          }
        });

        if (response.data.success && isMountedRef.current) {
          setProgress(100);
          setIsUploading(false);
          onUploadComplete(response.data.data);
          
          closeTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              onClose();
            }
          }, 2000);
        }
      } catch (error) {
        console.error('Upload error:', error);
        if (isMountedRef.current) {
          if (error.response?.status === 409) {
            setError('File already exists');
          } else {
            setError(error.response?.data?.message || 'Upload failed');
          }
          setIsUploading(false);
        }
      }
    };

    if (songFile && emotion) {
      uploadSong();
    }

    return () => {
      isMountedRef.current = false;
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [songFile, emotion, onUploadComplete, onClose]);

  const handleClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    onClose();
  };

  // Only render if there's a file to upload
  if (!songFile) return null;

  return ReactDOM.createPortal(
    <div className={`notification-mini ${error ? 'error' : ''}`}>
      <div className="notification-header">
        {error ? '❌ Upload Failed' : 
         progress === 100 ? '✅ Upload Complete' : 
         '📤 Uploading...'}
        <button className="notification-close" onClick={handleClose}>
          <FaTimes />
        </button>
      </div>
      <div className="notification-content">
        {error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            <div className="progress-text">{progress}% Complete</div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            {!isUploading && progress === 100 && (
              <div className="final-status">Upload Successful</div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Notification;