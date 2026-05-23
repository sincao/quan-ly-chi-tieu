import React from 'react';
import Icon from '@/components/ui/Icon';
import { DATA } from '@/lib/constants';
import { User } from '@supabase/supabase-js';

interface TopbarProps {
  title: string;
  breadcrumbs?: string[];
}

const Topbar: React.FC<TopbarProps> = ({ title, breadcrumbs }) => {
  return (
    <header className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-crumbs">
        {breadcrumbs && breadcrumbs.map((b, i) => (
          <React.Fragment key={i}>
            <span className="sep">/</span>
            <span>{b}</span>
          </React.Fragment>
        ))}
      </div>

      <div className="topbar-spacer"></div>
    </header>
  );
};

export default Topbar;
