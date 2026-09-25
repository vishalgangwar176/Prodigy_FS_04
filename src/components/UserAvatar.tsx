import React, { useState } from 'react';
import { getAvatarColor } from '../lib/utils';
import { UserPresenceBadge } from './UserPresenceBadge';

interface UserAvatarProps {
  name: string;
  photoURL?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  showPresence?: boolean;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  photoURL,
  size = 'md',
  isOnline,
  showPresence = false,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeDimensions = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  }[size];

  const presenceSize = size === 'xs' || size === 'sm' ? 'sm' : size === 'xl' ? 'lg' : 'md';

  // Compute initials
  const initials = React.useMemo(() => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name]);

  const bgColor = getAvatarColor(name || 'User');

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <div
        className={`${sizeDimensions} rounded-full overflow-hidden flex items-center justify-center font-bold text-white shadow-xs select-none ${
          !photoURL || imageError ? bgColor : 'bg-neutral-200 dark:bg-neutral-800'
        }`}
      >
        {photoURL && !imageError ? (
          <img
            src={photoURL}
            alt={name || 'User'}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {showPresence && typeof isOnline === 'boolean' && (
        <span className="absolute bottom-0 right-0">
          <UserPresenceBadge isOnline={isOnline} size={presenceSize} />
        </span>
      )}
    </div>
  );
};
