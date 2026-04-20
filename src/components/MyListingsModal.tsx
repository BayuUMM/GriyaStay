import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, ExternalLink, Search, Filter, Globe, MapPin } from 'lucide-react';
import { Property } from '../types';

interface MyListingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  listings: Property[];
  onDelete: (id: string) => void;
}

export default function MyListingsModal({ isOpen, onClose, listings, onDelete }: MyListingsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');

  const locations = useMemo(() => {
    const set = new Set(listings.map(l => {
      const parts = l.location.split(', ');
      return parts[parts.length - 1];
    }));
    return ['all', ...Array.from(set)].sort();
  }, [listings]);

  const filteredListings = useMemo(() => {
    return listings.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = filterLocation === 'all' || p.location.includes(filterLocation);
      return matchesSearch && matchesLocation;
    });
  }, [listings, searchTerm, filterLocation]);

  const totalValue = useMemo(() => {
    return listings.reduce((sum, p) => sum + p.price, 0);
  }, [listings]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-3xl rounded-sm shadow-2xl overflow-hidden flex flex-col h-[85vh]"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-sm flex items-center justify-center">
                  <Globe size={18} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest">Panel Penjual</h2>
                  <p className="text-[10px] text-white/40 font-bold">Kelola Iklan & Properti Anda</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Statistics Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-slate-100 border-b border-slate-100 shrink-0">
              <div className="bg-white p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Iklan</p>
                <p className="text-xl font-black text-slate-900">{listings.length}</p>
              </div>
              <div className="bg-white p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Estimasi Aset</p>
                <p className="text-xl font-black text-blue-600">
                  <span className="text-xs mr-1">Rp</span>
                  {totalValue > 1000000000 
                    ? `${(totalValue / 1000000000).toFixed(1)} Miliar` 
                    : totalValue.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="bg-white p-4 hidden md:block">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Jangkauan Wilayah</p>
                <p className="text-xl font-black text-slate-900">{locations.length - 1} Wilayah</p>
              </div>
            </div>

            {/* Tools Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="Cari di iklan Anda..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-sm text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <select 
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-sm text-xs font-bold focus:outline-none appearance-none min-w-[140px]"
                  >
                    {locations.map(l => (
                      <option key={l} value={l}>
                        {l === 'all' ? '🇮🇩 Semua Wilayah' : `📍 ${l}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {filteredListings.length === 0 ? (
                <div className="text-center py-20 bg-slate-50/50 rounded-sm border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                     <Search size={24} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-bold text-sm">Tidak ada iklan yang ditemukan.</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Coba ubah kata kunci atau filter wilayah</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredListings.map(property => (
                    <motion.div 
                      layout
                      key={property.id} 
                      className="flex gap-4 p-3 bg-white border border-slate-200 rounded-sm hover:border-slate-400 hover:shadow-md transition-all group relative animate-in fade-in slide-in-from-bottom-2"
                    >
                      <div className="w-24 h-24 md:w-28 md:h-28 rounded-sm overflow-hidden shrink-0 shadow-inner bg-slate-100">
                        <img 
                          src={property.image} 
                          alt={property.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="mb-auto">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm ${
                              property.type === 'hotel' ? 'bg-amber-100 text-amber-700' : 
                              property.type === 'apartment' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {property.type}
                            </span>
                          </div>
                          <h3 className="font-black text-slate-900 truncate text-sm leading-tight">{property.title}</h3>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 font-medium">
                            <MapPin size={10} className="text-slate-400" />
                            {property.location}
                          </p>
                        </div>
                        
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs font-black text-slate-950">
                             Rp {property.price.toLocaleString('id-ID')}
                          </p>
                          <div className="flex gap-1">
                            <button 
                              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200 rounded-sm"
                              title="Lihat Detail"
                            >
                               <ExternalLink size={14} />
                            </button>
                            <button 
                              onClick={() => {
                                onDelete(property.id);
                              }}
                              className="p-1.5 bg-red-50 text-red-400 hover:text-red-600 transition-all border border-red-100 hover:border-red-200 rounded-sm"
                              title="Hapus Iklan"
                            >
                               <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
