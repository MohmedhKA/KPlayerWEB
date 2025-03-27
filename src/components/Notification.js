import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { FaTimes } from 'react-icons/fa';
import './Notification.css';

const BASE_URL = process.env.REACT_APP_API_URL;

const Notification = ({ songFile, emotion, onClose, onUploadComplete }) => {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(true);
  const uploadAttemptedRef = useRef(false);
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    const uploadSong = async () => {
      if (!songFile || !emotion || uploadAttemptedRef.current) {
        return;
      }

      uploadAttemptedRef.current = true;
      const formData = new FormData();
      formData.append('song', songFile);
      formData.append('emotion', emotion);

      try {
        const response = await axios.post(`${BASE_URL}/api/music/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setProgress(Math.min(progress, 100));
          }
        });

        if (response.data.success) {
          setProgress(100);
          onUploadComplete(response.data.data);
          closeTimeoutRef.current = setTimeout(() => {
            onClose();
          }, 2000);
        }
      } catch (error) {
        console.error('Error uploading:', error.response || error);
        setProgress(100);
        
        if (error.response?.status === 409) {
          const songTitle = error.response.data?.existingSong?.title || 'this song';
          setError(`A song with title "${songTitle}" already exists`);
        } else {
          setError(error.response?.data?.message || 
                  `Upload failed: ${error.message || 'Unknown error'}`);
        }
      } finally {
        setUploading(false);
      }
    };

    uploadSong();

    // Cleanup function
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array since we use ref

  return ReactDOM.createPortal(
    <div className={`notification-mini ${error ? 'error' : ''}`}>
      <div className="notification-header">
        {error ? '❌ Upload Failed' : progress === 100 ? '✅ Complete' : '📤 Uploading'}
        <button className="notification-close" onClick={onClose}>
          <FaTimes />
        </button>
      </div>
      <div className="notification-content">
        {error ? (
          <>
            <div className="error-message">{error}</div>
            <div className="final-status">
              Failed: {error}
            </div>
          </>
        ) : (
          <>
            <div className="progress-text">{Math.round(progress)}% Complete</div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress === 100 && !error && (
              <div className="final-status">
                Upload Successful
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Notification;