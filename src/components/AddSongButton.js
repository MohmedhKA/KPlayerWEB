import React, { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import AddSongModal from './AddSongModal';
import './AddSongButton.css';

const AddSongButton = ({ onSongAdded }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSongAdded = (song) => {
    onSongAdded(song);
    setIsModalOpen(false);
  };

  return (
    <>
      <button 
        className="add-song-button"
        onClick={() => setIsModalOpen(true)}
        title="Add New Song"
      >
        <FaPlus />
      </button>
      
      <AddSongModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSongAdded={handleSongAdded}
      />
    </>
  );
};

export default AddSongButton; 