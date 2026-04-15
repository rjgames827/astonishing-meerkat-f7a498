import React from 'react';
import { motion } from 'framer-motion';

const MusicPlayer: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full flex-1 min-h-[calc(100vh-80px)] flex flex-col"
    >
      <iframe 
        src="https://monochrome.tf" 
        className="w-full flex-1 border-none"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        title="Monochrome Music Player"
      />
    </motion.div>
  );
};

export default MusicPlayer;
