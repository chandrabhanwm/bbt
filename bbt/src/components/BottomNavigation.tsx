import React from 'react';
import { motion } from 'motion/react';
import { Home, Map, Trophy, User } from 'lucide-react';
import { playClick } from '../utils/audio';

interface BottomNavigationProps {
  activeTab: 'home' | 'city' | 'leaderboard' | 'profile';
  setActiveTab: (tab: 'home' | 'city' | 'leaderboard' | 'profile') => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'city', label: 'City', icon: Map },
    { id: 'leaderboard', label: 'Ranks', icon: Trophy },
    { id: 'profile', label: 'Profile', icon: User },
  ] as const;

  const handleTabClick = (tabId: 'home' | 'city' | 'leaderboard' | 'profile') => {
    playClick();
    setActiveTab(tabId);
  };

  return (
    <div className="absolute bottom-6 inset-x-4 z-40 select-none">
      <div className="vault-card rounded-3xl py-2 px-3 flex justify-between items-center relative overflow-hidden">

        {/* Subtle decorative gold bottom glow line */}
        <div className="absolute bottom-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-marigold-400)]/30 to-transparent"></div>

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl cursor-pointer focus:outline-none transition-colors duration-200 min-h-[44px]"
              style={{ width: '23%' }}
            >
              {/* Slid-In glowing background gold capsule pill */}
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-[var(--color-vault-700)] border border-[var(--color-marigold-500)] shadow-[0_0_12px_rgba(255,168,61,0.25)] rounded-2xl"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}

              {/* Icon visual representation with bounce effect */}
              <motion.div
                animate={isActive ? { scale: [1, 1.25, 1] } : {}}
                transition={{ duration: 0.3 }}
                className={`relative z-10 ${isActive ? 'text-[var(--color-marigold-400)]' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Icon size={16} className="drop-shadow-sm" />
              </motion.div>

              {/* Sub-label text */}
              <span className={`text-[8.5px] font-display font-bold tracking-widest uppercase mt-1 relative z-10 transition-colors duration-200 ${isActive ? 'text-[var(--color-marigold-400)]' : 'text-slate-500'}`}>
                {tab.label}
              </span>

              {/* Tiny dot notification badge for leaderboard */}
              {tab.id === 'leaderboard' && !isActive && (
                <span className="absolute top-1 right-5 w-1.5 h-1.5 bg-[var(--color-marigold-500)] rounded-full animate-ping"></span>
              )}
            </button>
          );
        })}

      </div>
    </div>
  );
};
