import React from 'react';
import { PropertyType, FilterTab } from '../types';
import { Home, Hotel, Percent, Sparkles, Map, Building, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface CategoryTabsProps {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  counts?: Record<string, number>;
}

export default function CategoryTabs({ activeTab, onTabChange, counts }: CategoryTabsProps) {
  const categories = [
    { id: 'all', label: 'Semua', icon: Sparkles },
    { id: 'house', label: 'Jual Rumah', icon: Home },
    { id: 'hotel', label: 'Sewa Hotel', icon: Hotel },
    { id: 'apartment', label: 'Apartemen', icon: Building },
    { id: 'promo', label: 'Promo Gila', icon: Percent },
    { id: 'near', label: 'Sekitar', icon: Map },
    { id: 'mine', label: 'Milik Saya', icon: UserCheck },
  ];

  return (
    <div className="bg-white border-b border-slate-100 mb-6 md:mb-8 overflow-x-auto scrollbar-hide shadow-sm sticky top-[110px] md:top-[124px] lg:top-[132px] z-40 backdrop-blur-md bg-white/80">
      <div className="max-w-7xl mx-auto px-2 md:px-4 flex min-w-max md:min-w-0 md:justify-center gap-1 md:gap-4 lg:gap-8">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.id;
          const count = counts?.[cat.id] || 0;
          
          return (
            <button
              key={cat.id}
              onClick={() => onTabChange(cat.id as any)}
              className={`flex flex-col items-center gap-2 py-4 md:py-6 px-4 md:px-6 transition-all relative group border-b-2 ${
                isActive ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-900'
              }`}
            >
              <div className={`p-2.5 rounded-full transition-all duration-300 ${isActive ? 'bg-slate-900 text-white shadow-xl scale-110 shadow-slate-200' : 'bg-slate-50 group-hover:bg-slate-100 group-hover:scale-110'} relative`}>
                <Icon size={18} />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center border border-white">
                    {count}
                  </span>
                )}
              </div>
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest whitespace-nowrap">{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
