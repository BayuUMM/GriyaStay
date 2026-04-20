import React, { useState } from 'react';
import { Search, ShoppingCart, User, Heart, Bell, LogOut, ChevronDown, MapPin, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../context/UserContext';

interface NavbarProps {
  onSearch: (query: string) => void;
  favoriteCount: number;
  cartCount: number;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenCart: () => void;
  onShowMyListings: () => void;
}

export default function Navbar({ onSearch, favoriteCount, cartCount, onOpenAuth, onOpenCart, onShowMyListings }: NavbarProps) {
  const { user, logout } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white sticky top-0 z-50 border-b border-white/5 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top bar - Professional Utility */}
        <div className="hidden lg:flex justify-between items-center py-2 text-[11px] border-b border-white/5 text-white/50 font-medium">
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1.5"><Bell size={12} /> Pusat Notifikasi</a>
            <a href="#" className="hover:text-white transition-colors">Bantuan & Dukungan</a>
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1.5">
              <MapPin size={12} className="text-white/30" />
              <span>Indonesia</span>
            </a>
          </div>
          <div className="flex gap-6 items-center">
            <div className="flex items-center gap-4 border-r border-white/10 pr-6 mr-2">
              <span className="cursor-pointer hover:text-white">ID | IDR</span>
              <a href="#" className="hover:text-white transition-colors">Jadi Mitra Properti</a>
            </div>
            
            {user ? (
              <div className="flex items-center gap-3 group relative cursor-pointer">
                <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold text-white/80">
                  {user.name.charAt(0)}
                </div>
                <span className="font-bold text-white/90 group-hover:text-white transition-colors flex items-center gap-1">
                  Hi, {user.name} <ChevronDown size={10} />
                </span>
                <div className="absolute top-full right-0 mt-1 w-48 bg-slate-950 text-white rounded-sm shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2 z-50 border border-white/10 backdrop-blur-xl">
                  <div className="px-4 py-2 border-b border-white/5 mb-1">
                    <p className="font-bold text-xs">{user.name}</p>
                    <p className="text-[10px] text-white/40 truncate">{user.email}</p>
                  </div>
                  <button className="w-full text-left px-4 py-2 hover:bg-white/5 text-[11px] flex items-center gap-2 transition-colors"><User size={14} className="text-white/30" /> Profil Saya</button>
                  <button 
                    onClick={onShowMyListings}
                    className="w-full text-left px-4 py-2 hover:bg-white/5 text-[11px] flex items-center gap-2 transition-colors"
                  >
                    <Plus size={14} className="text-white/30" /> Iklan Saya
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-white/5 text-[11px] flex items-center gap-2 transition-colors"><ShoppingCart size={14} className="text-white/30" /> Pesanan Saya</button>
                  <div className="border-t border-white/5 my-1" />
                  <button 
                    onClick={logout}
                    className="w-full text-left px-4 py-2 hover:bg-white/5 text-[11px] text-rose-400 flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={14} /> Keluar Akun
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-4">
                <button onClick={() => onOpenAuth('login')} className="hover:text-white transition-colors">Masuk</button>
                <button onClick={() => onOpenAuth('register')} className="bg-white text-slate-900 px-4 py-1.5 rounded-sm hover:bg-slate-100 transition-all font-bold">Daftar Sekarang</button>
              </div>
            )}
          </div>
        </div>

        {/* Main Nav */}
        <div className="flex flex-col md:flex-row items-center gap-4 lg:gap-8 py-4 md:py-5">
          <div className="flex items-center justify-between w-full md:w-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => onSearch('')}
            >
              <div className="bg-white text-slate-950 w-10 h-10 rounded-sm flex items-center justify-center font-bold text-xl transition-all group-hover:rounded-xl shadow-lg ring-1 ring-white/20">
                G
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight leading-none text-white">GriyaStay</span>
                <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/40">Exclusive Real Estate</span>
              </div>
            </motion.div>

            {/* Mobile Icons */}
            <div className="flex items-center gap-4 md:hidden">
              <div className="relative cursor-pointer p-1" onClick={onOpenCart}>
                <ShoppingCart size={22} className="text-white/80" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-slate-950 text-[9px] font-bold px-1 rounded-full border border-slate-900">
                    {cartCount}
                  </span>
                )}
              </div>
              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="w-8 h-8 bg-white text-slate-950 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white/20 active:scale-95 transition-all"
                  >
                    {isMobileMenuOpen ? <X size={16} /> : user.name.charAt(0)}
                  </button>

                  <AnimatePresence>
                    {isMobileMenuOpen && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute top-full right-0 mt-3 w-56 bg-slate-900 text-white rounded-sm shadow-2xl py-3 z-[100] border border-white/10 ring-1 ring-black/50"
                      >
                        <div className="px-4 pb-3 mb-2 border-b border-white/5">
                          <p className="font-bold text-sm text-white">{user.name}</p>
                          <p className="text-[10px] text-white/40 truncate">{user.email}</p>
                        </div>
                        <div className="flex flex-col">
                          <button 
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-sm transition-colors text-white/70 hover:text-white"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <User size={16} className="text-white/30" /> Profil Saya
                          </button>
                          <button 
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-sm transition-colors text-white/70 hover:text-white"
                            onClick={() => {
                              onShowMyListings();
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <Plus size={16} className="text-white/30" /> Iklan Saya
                          </button>
                          <button 
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-sm transition-colors text-white/70 hover:text-white"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <ShoppingCart size={16} className="text-white/30" /> Pesanan Saya
                          </button>
                          <div className="h-px bg-white/5 my-2" />
                          <button 
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-sm transition-colors text-rose-400 hover:text-rose-300"
                            onClick={() => {
                              logout();
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <LogOut size={16} /> Keluar Akun
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button 
                  onClick={() => onOpenAuth('login')}
                  className="p-1 text-white/80"
                >
                  <User size={22} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 w-full relative">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Cari villa di Bali, Apartemen di Jakarta, atau Hotel di Bandung..." 
                onChange={(e) => onSearch(e.target.value)}
                className="w-full py-3 px-5 pr-14 rounded-sm text-white border border-white/10 focus:outline-none focus:ring-4 focus:ring-white/5 bg-white/5 transition-all font-medium text-sm md:text-base placeholder:text-white/30 backdrop-blur-sm group-focus-within:bg-white/10 group-focus-within:border-white/20"
              />
              <button className="absolute right-1 text-white/80 hover:text-white transition-colors p-2 top-1/2 -translate-y-1/2">
                <Search size={22} />
              </button>
            </div>
          </div>

          {/* Desktop Icons */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex flex-col items-center gap-0.5 cursor-pointer group text-white/60 hover:text-white transition-colors relative">
              <Heart size={22} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Favorit</span>
              {favoriteCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-slate-900">
                  {favoriteCount}
                </span>
              )}
            </div>
            <div 
              onClick={onOpenCart}
              className="flex flex-col items-center gap-0.5 cursor-pointer group text-white/60 hover:text-white transition-colors relative"
            >
              <ShoppingCart size={22} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Keranjang</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-slate-900">
                  {cartCount}
                </span>
              )}
            </div>
            <div className="w-px h-8 bg-white/10 mx-1" />
            <div className="flex items-center gap-3 cursor-pointer group px-1">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="text-right hidden xl:block">
                    <p className="text-[10px] text-white/40 font-bold uppercase">Membership Elite</p>
                    <p className="text-xs font-bold text-white">{user.name}</p>
                  </div>
                  <div className="w-10 h-10 bg-white text-slate-950 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ring-1 ring-white/20 border-2 border-slate-900 group-hover:scale-110 transition-transform">
                    {user.name.charAt(0)}
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => onOpenAuth('login')}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 bg-white/5 text-white/40 rounded-full flex items-center justify-center transition-colors group-hover:bg-white/10 group-hover:text-white/80 ring-1 ring-white/10">
                    <User size={22} />
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-[10px] text-white/40 font-bold uppercase">Selamat Datang</p>
                    <p className="text-xs font-bold text-white transition-colors group-hover:text-blue-300 underline underline-offset-2">Login / Daftar</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>

  );
}
