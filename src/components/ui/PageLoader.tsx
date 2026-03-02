import React from 'react';
import { motion } from 'framer-motion';
import Spinner from './Spinner';

export interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

const PageLoader: React.FC<PageLoaderProps> = ({
  message,
  fullScreen = true,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex flex-col items-center justify-center gap-5 bg-white ${
        fullScreen ? 'min-h-screen' : 'min-h-64'
      }`}
    >
      <Spinner size="xl" color="brand" />
      {message && (
        <p className="text-sm text-gray-400 font-body tracking-wide">{message}</p>
      )}
    </motion.div>
  );
};

export default PageLoader;
