import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, ArrowRight, ShieldCheck, Camera, CreditCard } from 'lucide-react';
import { useUser } from '../context/UserContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'ktp';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'ktp'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [ktpNumber, setKtpNumber] = useState('');
  const [ktpPhoto, setKtpPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { login, register, loginWithGoogle, verifyKtp, user } = useUser();

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        const loggedInUser = await login(email, password, 'User');
        if (loggedInUser) {
          onClose();
        } else {
          setError('Gagal masuk. Silakan periksa kembali email Anda.');
        }
      } else if (mode === 'register') {
        const registeredUser = await register(email, password, name);
        if (registeredUser) {
          if (registeredUser.isKtpVerified) {
            onClose();
          } else {
            setMode('ktp');
          }
        } else {
          setError('Registrasi gagal. Silakan coba lagi.');
        }
      } else if (mode === 'ktp') {
        await verifyKtp(ktpNumber, ktpPhoto || undefined);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipKtp = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-[340px] sm:max-w-[370px] bg-white rounded-xl shadow-2xl overflow-y-auto max-h-[85vh] scrollbar-none"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 hover:bg-slate-100 rounded-full transition-colors z-10"
              id="auth-modal-close-btn"
            >
              <X size={18} className="text-slate-500" />
            </button>

            <div className="p-5 sm:p-6" id="auth-modal-content-container">
              {mode !== 'ktp' ? (
                <>
                  <div className="text-center mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-display mb-1">
                      {mode === 'login' ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}
                    </h2>
                    <p className="text-slate-500 text-xs">
                      {mode === 'login' 
                        ? 'Masuk untuk mengelola properti impian Anda' 
                        : 'Daftar sekarang dan temukan hunian terbaik'}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    {mode === 'register' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nama Lengkap</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Masukkan nama Anda"
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all text-sm"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@contoh.com"
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Kata Sandi</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all text-sm"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg text-center font-semibold animate-pulse">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 group mt-4"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          {mode === 'login' ? 'Masuk' : 'Daftar Sekarang'}
                          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-widest">
                      <span className="bg-white px-2.5 text-slate-400">Atau</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={async () => {
                      setError(null);
                      setLoading(true);
                      try {
                        const googleUser = await loginWithGoogle();
                        if (googleUser) {
                          onClose();
                        } else {
                          setError('Masuk dengan Google gagal.');
                        }
                      } catch (err: any) {
                        console.error(err);
                        setError(err?.message || 'Gagal masuk dengan Google.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99] duration-150"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.102 1.025 5.047 1.926l3.227-3.227C18.232 1.346 15.422.5 12.24.5a11.5 11.5 0 0 0-11.5 11.5 11.5 11.5 0 0 0 11.5 11.5c11.97 0 12.24-10.8 11.97-12.215H12.24z"
                      />
                    </svg>
                    Masuk dengan Google
                  </button>

                  <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-500">
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
                  <div className="mb-4 flex justify-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                      <ShieldCheck size={24} />
                    </div>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-display mb-1">Verifikasi KTP</h2>
                  <p className="text-slate-500 text-xs mb-4">
                    Pastikan Anda cukup umur untuk transaksi properti. Verifikasi identitas Anda dengan mudah.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="space-y-1 text-left row-gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nomor NIK KTP</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          required
                          value={ktpNumber}
                          onChange={(e) => setKtpNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                          placeholder="320xxxxxxxxxxxxx"
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5 ml-1">NIK harus 16 digit angka.</p>
                    </div>

                    <div 
                      onClick={handlePhotoClick}
                      className="p-3 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white transition-colors group cursor-pointer overflow-hidden min-h-[90px] flex items-center justify-center"
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
                            <p className="text-white text-[10px] font-bold">Ganti Foto</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <Camera className="text-slate-400 group-hover:text-blue-500 transition-colors" size={20} />
                          <p className="text-[11px] font-bold text-slate-500 group-hover:text-slate-700">Ambil Foto KTP</p>
                          <p className="text-[9px] text-slate-400">Pastikan foto jelas & tidak bising</p>
                        </div>
                      )}
                    </div>

                    {error && (
                      <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg text-center font-semibold animate-pulse">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={ktpNumber.length !== 16 || !ktpPhoto || loading}
                      className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-blue-100"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Verifikasi Sekarang'
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleSkipKtp}
                      className="w-full text-slate-400 py-1.5 text-xs font-medium hover:text-slate-600 transition-colors"
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
