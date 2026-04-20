import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, MapPin, Plus, CheckCircle2 } from 'lucide-react';
import { Property } from '../types';
import { useUser } from '../context/UserContext';

interface SellPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (property: Property) => void;
}

export default function SellPropertyModal({ isOpen, onClose, onAdd }: SellPropertyModalProps) {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    title: '',
    type: 'house' as 'house' | 'hotel' | 'apartment',
    price: '',
    city: '',
    address: '',
    description: '',
    image: '',
    features: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProperty: Property = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: formData.title,
      type: formData.type,
      price: Number(formData.price),
      location: formData.city,
      description: formData.description,
      image: formData.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      rating: 5.0,
      reviews: 0,
      features: formData.features.split(',').map(f => f.trim()),
      createdAt: new Date().toISOString(),
      ownerId: user?.email
    };

    onAdd(newProperty);
    setFormData({
      title: '',
      type: 'house',
      price: '',
      city: '',
      address: '',
      description: '',
      image: '',
      features: ''
    });
  };

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
            className="relative bg-white w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <Plus size={20} className="bg-slate-800 text-white rounded-full p-0.5" /> Jual Properti Anda
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Properti</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Contoh: Villa Mewah Seminyak"
                    className="w-full p-2.5 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-slate-800 bg-slate-50/50"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipe Properti</label>
                  <select 
                    className="w-full p-2.5 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-slate-800 bg-slate-50/50"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                  >
                    <option value="house">Rumah / Villa</option>
                    <option value="hotel">Hotel / Penginapan</option>
                    <option value="apartment">Apartemen</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Harga (IDR)</label>
                  <input 
                    required
                    type="number" 
                    placeholder="Contoh: 2500000000"
                    className="w-full p-2.5 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-slate-800 bg-slate-50/50"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kota / Wilayah</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Contoh: Jakarta Selatan, Bali, Bandung"
                    className="w-full p-2.5 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-slate-800 bg-slate-50/50"
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alamat Lengkap</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input 
                    required
                    type="text" 
                    placeholder="Jl. Raya Seminyak No. 123..."
                    className="w-full p-2.5 pl-10 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-slate-800 bg-slate-50/50"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deskripsi</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Ceritakan keunggulan properti Anda..."
                  className="w-full p-2.5 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-slate-800 resize-none bg-slate-50/50"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">URL Gambar Properti</label>
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-slate-100 rounded-sm border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {formData.image ? (
                      <img 
                        src={formData.image} 
                        className="w-full h-full object-cover" 
                        alt="Preview" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                    ) : (
                      <Camera size={24} className="text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 relative">
                    <Camera size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="url" 
                      placeholder="https://images.unsplash.com/..."
                      className="w-full p-2.5 pl-10 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-slate-800 bg-slate-50/50"
                      value={formData.image}
                      onChange={e => setFormData({...formData, image: e.target.value})}
                    />
                    <p className="text-[9px] text-slate-400 italic mt-1">Kosongkan untuk menggunakan gambar default yang sudah kami siapkan.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fitur (Pisahkan dengan koma)</label>
                <input 
                  type="text" 
                  placeholder="Kolam Renang, Taman, Garansi, dll"
                  className="w-full p-2.5 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-slate-800 bg-slate-50/50"
                  value={formData.features}
                  onChange={e => setFormData({...formData, features: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-800 text-white py-3.5 rounded-sm font-bold hover:bg-slate-900 transition-all shadow-xl flex items-center justify-center gap-2 mt-4 shadow-slate-200"
              >
                Daftarkan Properti <CheckCircle2 size={18} />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
