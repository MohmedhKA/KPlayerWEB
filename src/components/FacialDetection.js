import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import './FacialDetection.css';

const FacialDetection = ({ onEmotionDetected }) => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt');
  const detectionRef = useRef([]);
  const analyzeTimeoutRef = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models')
        ]);
        setIsInitialized(true);
      } catch (err) {
        setError('Error loading face detection models: ' + err.message);
      }
    };

    loadModels();

    // Check initial permission status
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' })
        .then(permissionStatus => {
          setPermissionStatus(permissionStatus.state);
          permissionStatus.onchange = () => {
            setPermissionStatus(permissionStatus.state);
          };
        });
    }
  }, []);

  const startVideo = async () => {
    setError(null);
    
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Your browser does not support camera access');
      return;
    }

    try {
      // First check if permission is granted
      if (permissionStatus === 'denied') {
        throw new Error('Camera permission was denied. Please enable it in your browser settings.');
      }

      const constraints = {
        video: {
          width: { ideal: 720 },
          height: { ideal: 560 },
          facingMode: 'user'
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Add event listeners for video
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
        };
      }
    } catch (err) {
      console.error('Webcam error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera access denied. Please allow camera access in your browser settings and refresh the page.');
      } else {
        setError(`Could not access webcam: ${err.message}`);
      }
    }
  };

  const mapExpression = (expressions) => {
    const emotionMap = {
      happy: 'Joy',
      sad: 'Sad',
      surprised: 'Surprise',
      angry: 'Anger',
      neutral: 'Excitement' // Updated display text
    };

    let maxExpression = null;
    let maxValue = -1;

    Object.entries(expressions).forEach(([expression, value]) => {
      if (emotionMap[expression] && value > maxValue) {
        maxValue = value;
        maxExpression = emotionMap[expression];
      }
    });

    return maxExpression || 'Joy';
  };

  const analyzeEmotion = async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    setIsAnalyzing(true);
    detectionRef.current = [];

    try {
      // Take multiple samples over 3 seconds
      for (let i = 0; i < 6; i++) {
        const detections = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();

        if (detections) {
          detectionRef.current.push(detections.expressions);
          
          // Draw the detection
          const displaySize = { 
            width: videoRef.current.width, 
            height: videoRef.current.height 
          };
          faceapi.matchDimensions(canvasRef.current, displaySize);
          
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        }

        // Wait 500ms between samples
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Average the emotions
      if (detectionRef.current.length > 0) {
        const averageExpressions = {};
        const keys = Object.keys(detectionRef.current[0]);
        
        keys.forEach(key => {
          averageExpressions[key] = detectionRef.current.reduce(
            (sum, curr) => sum + curr[key], 0
          ) / detectionRef.current.length;
        });

        const emotion = mapExpression(averageExpressions);
        onEmotionDetected(emotion);
      }

      // Stop the video stream
      const stream = videoRef.current.srcObject;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    } catch (error) {
      console.error('Error analyzing emotion:', error);
      setError('Failed to analyze expression. Please try again.');
    }

    setIsAnalyzing(false);
    detectionRef.current = [];
  };

  useEffect(() => {
    if (isInitialized && !isAnalyzing) {
      startVideo();
    }

    return () => {
      if (analyzeTimeoutRef.current) {
        clearTimeout(analyzeTimeoutRef.current);
      }
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isInitialized]);

  return (
    <div className="facial-detection">
      {error ? (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button 
            className="retry-button"
            onClick={() => {
              setError(null);
              startVideo();
            }}
          >
            Retry Camera Access
          </button>
          <p className="help-text">
            If the problem persists, please:
            <ol>
              <li>Check if your camera is connected and working</li>
              <li>Allow camera access in your browser settings</li>
              <li>Try refreshing the page</li>
            </ol>
          </p>
        </div>
      ) : (
        <div className="video-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onPlay={() => {
              // Delay analysis start to ensure video is playing properly
              analyzeTimeoutRef.current = setTimeout(analyzeEmotion, 1000);
            }}
            width="720"
            height="560"
          />
          <canvas ref={canvasRef} className="detection-overlay" />
          {isAnalyzing && (
            <div className="analyzing-overlay">
              <div className="spinner"></div>
              <p>Analyzing your expression... Please maintain your expression.</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{
                    animation: 'fillProgress 3s linear forwards'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FacialDetection;