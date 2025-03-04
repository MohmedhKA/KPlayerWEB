import React, { useState } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL;

const SearchBar = ({ onSearchResults }) => {
  const [query, setQuery] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      // If query is empty, fetch all songs
      const endpoint = query.trim() 
        ? `${BASE_URL}/api/music/search?keyword=${query}`
        : `${BASE_URL}/api/music`;

      const response = await axios.get(endpoint);
      if (response.data.success) {
        onSearchResults(response.data.data);
      }
    } catch (error) {
      console.error('Error searching songs:', error);
    }
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search for songs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
    </div>
  );
};

export default SearchBar; 