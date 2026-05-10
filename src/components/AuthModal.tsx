import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, ArrowRight, ShieldCheck, Camera, CreditCard } from 'lucide-react';
import { useUser } from '../context/UserContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'ktp'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [ktpNumber, setKtpNumber] = useState('');
  const [ktpPhoto, setKtpPhoto] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { login, register, verifyKtp, user } = useUser();

  useEffect(() => {
    if (isOpen && user && !user.isKtpVerified) {
      setMode('ktp');
    }
  }, [isOpen, user]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setKtpPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      login(email, 'User'); // Mock name for login
      setMode('ktp');
    } else if (mode === 'register') {
      register(email, name);
      setMode('ktp');
    } else if (mode === 'ktp') {
      verifyKtp();
      onClose();
    }
  };

  const handleSkipKtp = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors z-10"
            >
              <X size={20} className="text-slate-500" />
            </button>

            <div className="p-8">
              {mode !== 'ktp' ? (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 font-display mb-2">
                      {mode === 'login' ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}
                    </h2>
                    <p className="text-slate-500 text-sm">
                      {mode === 'login' 
                        ? 'Masuk untuk mengelola properti impian Anda' 
                        : 'Daftar sekarang dan temukan hunian terbaik'}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'register' && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nama Lengkap</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Masukkan nama Anda"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all text-sm"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@contoh.com"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Kata Sandi</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all text-sm"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group mt-6"
                    >
                      {mode === 'login' ? 'Masuk' : 'Daftar Sekarang'}
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>

                  <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-500">
                      {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
                      <button
                        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                        className="ml-1 font-bold text-slate-900 hover:underline"
                      >
                        {mode === 'login' ? 'Daftar di sini' : 'Masuk di sini'}
                      </button>
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                      <ShieldCheck size={32} />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 font-display mb-2">Verifikasi KTP</h2>
                  <p className="text-slate-500 text-sm mb-8">
                    Pastikan Anda cukup umur untuk melakukan transaksi properti. Silakan verifikasi identitas Anda.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1 text-left">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nomor NIK KTP</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          required
                          value={ktpNumber}
                          onChange={(e) => setKtpNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                          placeholder="320xxxxxxxxxxxxx"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 ml-1">NIK harus 16 digit angka.</p>
                    </div>

                    <div 
                      onClick={handlePhotoClick}
                      className="p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white transition-colors group cursor-pointer overflow-hidden min-h-[100px] flex items-center justify-center"
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange}
                      />
                      {ktpPhoto ? (
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                          <img src={ktpPhoto} alt="KTP Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white text-xs font-bold">Ganti Foto</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Camera className="text-slate-400 group-hover:text-blue-500 transition-colors" size={24} />
                          <p className="text-xs font-bold text-slate-500 group-hover:text-slate-700">Ambil Foto KTP</p>
                          <p className="text-[10px] text-slate-400">Pastikan foto jelas & tidak blur</p>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={ktpNumber.length !== 16 || !ktpPhoto}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-6 shadow-lg shadow-blue-100"
                    >
                      Verifikasi Sekarang
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleSkipKtp}
                      className="w-full text-slate-400 py-2 text-sm font-medium hover:text-slate-600 transition-colors"
                    >
                      Lakukan Nanti
                    </button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
