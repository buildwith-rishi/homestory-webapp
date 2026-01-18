import React from 'react';

export interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  initials?: string;
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  size = 'md',
  initials,
  status,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'w-8 h-8 text-caption',
    md: 'w-10 h-10 text-body-sm',
    lg: 'w-16 h-16 text-body',
    xl: 'w-24 h-24 text-display-sm',
  };

  const statusSizeStyles = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  };

  const statusColorStyles = {
    online: 'bg-olive',
    offline: 'bg-ash',
    busy: 'bg-burgundy',
    away: 'bg-rose',
  };

  const getInitials = () => {
    if (initials) return initials;
    if (alt) {
      return alt
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return '?';
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`${sizeStyles[size]} rounded-full overflow-hidden flex items-center justify-center font-body font-medium bg-primary text-white`}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <span>{getInitials()}</span>
        )}
      </div>
      {status && (
        <div
          className={`absolute bottom-0 right-0 ${statusSizeStyles[size]} ${
            statusColorStyles[status]
          } rounded-full border-2 border-white`}
        />
      )}
    </div>
  );
};

export default Avatar;
