
import React from 'react';
import { Layers, Calendar, FolderClosed, Timer, Settings } from 'lucide-react';
import { ViewType } from '../types';

interface BottomNavProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeView, onViewChange }) => {
  const navItems = [
    { id: 'notes', icon: Layers, label: 'Notes' },
    { id: 'timeline', icon: Calendar, label: 'Timeline' },
    { id: 'buckets', icon: FolderClosed, label: 'Buckets' },
    { id: 'pomodoro', icon: Timer, label: 'Focus' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (id: string) => {
    if (id === 'buckets' && activeView === 'bucket_detail') return true;
    return activeView === id;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800/50 px-4 pt-2 pb-6 md:pb-4 flex justify-around items-center z-50">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id as ViewType)}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${
            isActive(item.id) ? 'text-indigo-400' : 'text-zinc-500'
          }`}
        >
          <item.icon size={22} strokeWidth={isActive(item.id) ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-tight uppercase">{item.label}</span>
          {isActive(item.id) && (
            <div className="w-1 h-1 bg-indigo-400 rounded-full mt-0.5 animate-pulse" />
          )}
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
