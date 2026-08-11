import React, { useState } from 'react';

/**
 * Renders a player's avatar — either a chosen emoji (the existing,
 * original system) or a real imported Google profile photo, whichever
 * the stored value actually is. A URL is the one thing an emoji
 * character can never look like, so checking for "http" is a reliable,
 * simple way to tell them apart without needing a separate field or
 * type change anywhere else in the app — avatarEmoji already just
 * holds an arbitrary string.
 */
export const PlayerAvatar: React.FC<{ value: string; className?: string; fontSize?: number }> = ({ value, className, fontSize }) => {
  const [photoFailed, setPhotoFailed] = useState(false);
  const isPhoto = !photoFailed && (value.startsWith('http://') || value.startsWith('https://'));

  if (isPhoto) {
    return (
      <img
        src={value}
        alt=""
        className={className}
        style={{ objectFit: 'cover', borderRadius: '50%' }}
        // A broken/expired Google photo URL should never leave a blank
        // gap where an avatar should be — falls back to a neutral
        // silhouette emoji rather than a broken-image icon.
        onError={() => setPhotoFailed(true)}
      />
    );
  }
  return <span className={className} style={fontSize ? { fontSize, lineHeight: 1 } : undefined}>{photoFailed ? '👤' : value}</span>;
};
