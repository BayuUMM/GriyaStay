import React, { useState } from "react";
import {
  Search,
  ShoppingCart,
  User,
  Heart,
  Bell,
  LogOut,
  ChevronDown,
  MapPin,
  Plus,
  X,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useUser } from "../context/UserContext";

const Tooltip = ({
  children,
  text,
}: {
  children: React.ReactNode;
  text: string;
}) => {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute top-full mt-2 px-3 py-1.5 bg-white text-slate-900 text-[10px] font-black rounded-sm shadow-2xl z-[100] uppercase"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface NavbarProps {
  onSearch: (query: string) => void;
  favoriteCount: number;
  cartCount: number;
  onOpenAuth: (mode: "login" | "register") => void;
  onOpenCart: () => void;
  onShowMyListings: () => void;
}

export default function Navbar({
  onSearch,
  favoriteCount,
  cartCount,
  onOpenAuth,
  onOpenCart,
  onShowMyListings,
}: NavbarProps) {
  const { user, logout } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-slate-950 text-white sticky top-0 z-50 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4">
        {/* TOP BAR */}
        <div className="hidden lg:flex justify-between items-center py-2 text-[11px] text-white/60">
          <div className="flex gap-6">
            <a href="#" className="hover:text-white flex items-center gap-1">
              <Bell size={12} /> Notifikasi
            </a>
            <a href="#">Bantuan</a>
            <a href="#" className="flex items-center gap-1">
              <MapPin size={12} /> Indonesia
            </a>
          </div>

          <div className="flex gap-6 items-center">
            {user ? (
              <div className="flex items-center gap-3 relative cursor-pointer group">
                <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold">
                  {user.name.charAt(0)}
                </div>

                <span className="font-bold flex items-center gap-1">
                  Hi, {user.name} <ChevronDown size={10} />
                </span>

                {/* DROPDOWN */}
                <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 rounded-sm border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-xs font-bold">{user.name}</p>
                    <p className="text-[10px] text-white/40">{user.email}</p>
                  </div>

                  {!user.isKtpVerified && (
                    <button
                      onClick={() => onOpenAuth("login")}
                      className="w-full text-left px-4 py-2 text-amber-400 hover:bg-white/5 text-[11px] flex items-center gap-2"
                    >
                      <ShieldCheck size={14} />
                      Verifikasi KTP
                    </button>
                  )}

                  <button
                    onClick={onShowMyListings}
                    className="w-full text-left px-4 py-2 hover:bg-white/5 text-[11px]"
                  >
                    <Plus size={14} className="inline mr-2" />
                    Iklan Saya
                  </button>

                  <div className="border-t border-white/10 my-1" />

                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-white/5 text-[11px]"
                  >
                    <LogOut size={14} className="inline mr-2" />
                    Keluar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-4">
                <button onClick={() => onOpenAuth("login")}>Masuk</button>
                <button
                  onClick={() => onOpenAuth("register")}
                  className="bg-white text-black px-4 py-1 rounded-sm"
                >
                  Daftar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SEARCH */}
        <div className="py-4 flex gap-4 items-center">
          <input
            type="text"
            placeholder="Cari properti..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-full p-3 rounded-sm bg-white/5 border border-white/10"
          />

          <button onClick={onOpenCart}>
            <ShoppingCart />
          </button>
        </div>
      </div>
    </nav>
  );
}
