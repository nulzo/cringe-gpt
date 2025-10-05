import React from 'react';

interface MessageImage {
  id: number;
  name: string;
  url: string;
  mimeType: string;
}

interface MessageImagesProps {
  images: MessageImage[];
  className?: string;
}

export const MessageImages: React.FC<MessageImagesProps> = ({ images, className = '' }) => {
  if (!images || images.length === 0) return null;

  return (
    <div className={`message-images ${className}`}>
      {images.map((image) => (
        <div key={image.id} className="message-image-container">
          <img
            src={image.url}
            alt={image.name}
            className="message-image"
            style={{
              maxWidth: '300px',
              maxHeight: '300px',
              borderRadius: '8px',
              objectFit: 'cover'
            }}
            onError={(e) => {
              console.error('Failed to load image:', image.url);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      ))}
    </div>
  );
};