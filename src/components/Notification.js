import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { FaTimes } from 'react-icons/fa';
import './Notification.css';

const Notification = ({ message, type, progress, onClose }) => {
  const closeTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Auto close successful notifications after 2 seconds
    if (type === 'success' && progress === 100) {
      closeTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          onClose();
        }
      }, 2000);
    }

    return () => {
      isMountedRef.current = false;
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [type, progress, onClose]);

  const handleClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    onClose();
  };

  const isError = type === 'error';
  const isSuccess = type === 'success';

  return ReactDOM.createPortal(
    <div className={`notification-mini ${isError ? 'error' : ''}`}>
      <div className="notification-header">
        {isError ? '❌ Upload Failed' : 
         isSuccess && progress === 100 ? '✅ Upload Complete' : 
         '📤 Uploading...'}
        <button className="notification-close" onClick={handleClose}>
          <FaTimes />
        </button>
      </div>
      <div className="notification-content">
        {isError ? (
          <div className="error-message">{message}</div>
        ) : (
          <>
            <div className="progress-text">{progress}% Complete</div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            {isSuccess && progress === 100 && (
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