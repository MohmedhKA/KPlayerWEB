import React from 'react';
import './TabNavigation.css';

const TabNavigation = ({ activeTab, onTabChange }) => {
  return (
    <div className="tab-navigation">
      <button 
        className={`tab-button ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => onTabChange('home')}
      >
        Home
      </button>
      <button 
        className={`tab-button ${activeTab === 'playlists' ? 'active' : ''}`}
        onClick={() => onTabChange('playlists')}
      >
        Playlists
      </button>
    </div>
  );
};

export default TabNavigation; 