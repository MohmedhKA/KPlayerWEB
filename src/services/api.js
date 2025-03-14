import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL;

const api = {
  // Get all songs
  getAllSongs: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/music`);
      return response.data;
    } catch (error) {
      console.error('Error fetching songs:', error);
      throw error;
    }
  },

  // Search songs
  searchSongs: async (keyword) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/music/search?keyword=${encodeURIComponent(keyword)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching songs:', error);
      throw error;
    }
  },

  // Get song by ID
  getSongById: async (id) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/music/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching song:', error);
      throw error;
    }
  },

  // Upload song
  uploadSong: async (formData) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/music/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading song:', error);
      throw error;
    }
  }
};

export default api; 