import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './WeatherDetection.css';

const WeatherDetection = ({ onEmotionDetected, onClose }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getEmotionForWeather = (weather) => {
    switch (weather.toLowerCase()) {
      case "clear":
        return "Joy";
      case "clouds":
        return "Excitement";
      case "rain":
      case "drizzle":
        return "Sad";
      case "thunderstorm":
        return "Anger";
      case "snow":
        return "Surprise";
      default:
        return "Joy";
    }
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);

        const weatherResponse = await axios.get(
          'https://api.openweathermap.org/data/2.5/weather?lat=11.341036&lon=77.717163&appid=b25b1d31edcf793969a01b0de031afa7&units=metric'
        );

        if (!weatherResponse.data || !weatherResponse.data.weather) {
          throw new Error('Invalid weather data received');
        }

        const weatherData = {
          condition: weatherResponse.data.weather[0].main,
          description: weatherResponse.data.weather[0].description,
          temperature: Math.round(weatherResponse.data.main.temp),
          location: weatherResponse.data.name,
          humidity: weatherResponse.data.main.humidity,
          windSpeed: weatherResponse.data.wind.speed
        };

        setWeather(weatherData);
        const emotion = getEmotionForWeather(weatherData.condition);
        onEmotionDetected(emotion);
        
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Error fetching weather data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [onEmotionDetected]);

  const renderWeatherContent = () => {
    if (loading) {
      return (
        <div className="weather-loading">
          <div className="weather-spinner"></div>
          <p>Fetching weather data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="weather-error">
          <p>❌ {error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      );
    }

    if (!weather) return null;

    return (
      <div className="weather-content">
        <div className="weather-info">
          <h2 className="weather-condition">{weather.condition}</h2>
          <p className="weather-description">{weather.description}</p>
          <div className="weather-details">
            <p className="weather-temperature">{weather.temperature}°C</p>
            <p className="weather-humidity">Humidity: {weather.humidity}%</p>
            <p className="weather-wind">Wind: {weather.windSpeed} m/s</p>
          </div>
          <p className="weather-location">{weather.location}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="weather-detection">
      <button className="close-weather" onClick={onClose}>×</button>
      {renderWeatherContent()}
    </div>
  );
};

export default WeatherDetection;