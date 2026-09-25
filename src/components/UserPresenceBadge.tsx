import React from 'react';

interface UserPresenceBadgeProps {
  isOnline: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserPresenceBadge: React.FC<UserPresenceBadgeProps> = ({
  isOnline,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-2.5 h-2.5 ring-1.5',
    md: 'w-3.5 h-3.5 ring-2',
    lg: 'w-4 h-4 ring-2',
  }[size];

  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-full ${className}`}
      title={isOnline ? 'Online' : 'Offline'}
    >
      <span
        className={`block rounded-full ring-white dark:ring-neutral-900 transition-colors ${sizeClasses} ${
          isOnline ? 'bg-emerald-500' : 'bg-neutral-400 dark:bg-neutral-600'
        }`}
      />
      {isOnline && (
        <span className="absolute -inset-0.5 rounded-full bg-emerald-500/30 animate-ping opacity-75" />
      )}
    </span>
  );
};
