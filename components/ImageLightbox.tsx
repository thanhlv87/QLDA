import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from './Icons.tsx';

interface ImageLightboxProps {
  images: string[];
  startIndex: number;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ images, startIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  useEffect(() => {
    setCurrentIndex(startIndex);
  }, [startIndex]);

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prevIndex => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prevIndex => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex(prevIndex => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(prevIndex => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [images.length, onClose]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
        aria-label="Close"
      >
        <XIcon className="h-8 w-8" />
      </button>

      <div 
        className="relative w-full h-full flex items-center justify-center"
        onClick={e => e.stopPropagation()}
      >
        {images.length > 1 && (
          <button
            onClick={goToPrevious}
            className="absolute left-2 sm:left-4 text-white hover:text-gray-300 p-2 bg-black bg-opacity-30 rounded-full z-50 transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeftIcon className="h-8 w-8" />
          </button>
        )}

        <div className="max-w-4xl max-h-[90vh] flex items-center justify-center">
            <img 
              src={images[currentIndex]} 
              alt={`Image ${currentIndex + 1} of ${images.length}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
        </div>

        {images.length > 1 && (
            <button
              onClick={goToNext}
              className="absolute right-2 sm:right-4 text-white hover:text-gray-300 p-2 bg-black bg-opacity-30 rounded-full z-50 transition-colors"
              aria-label="Next image"
            >
              <ChevronRightIcon className="h-8 w-8" />
            </button>
        )}
        
        {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
                {currentIndex + 1} / {images.length}
            </div>
        )}
      </div>
    </div>
  );
};

export default ImageLightbox;