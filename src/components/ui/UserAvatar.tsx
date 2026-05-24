import React from 'react';

export function getInitials(p: any): string {
  if (!p) return '??';
  if (p.last_name && p.first_name) return (p.last_name[0] + p.first_name[0]).toUpperCase();
  if (p.display_name) {
    const parts = p.display_name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return p.display_name.substring(0, 2).toUpperCase();
  }
  return '??';
}

interface UserAvatarProps {
  profile: any;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ profile, className, style, children }) => (
  <div className={className} style={{ overflow: 'hidden', ...style }}>
    {profile?.avatar_url
      ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      : getInitials(profile)}
    {children}
  </div>
);

export default UserAvatar;
