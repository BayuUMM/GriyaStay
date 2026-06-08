import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, MapPin, Plus, CheckCircle2, Compass, Home, Building2, Building, Trash2 } from 'lucide-react';
import { Property } from '../types';
import { useUser } from '../context/UserContext';

interface SellPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (property: Property) => void;
}

const PHOTO_PRESETS = [
  { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', label: 'Villa Seminyak' },
  { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', label: 'Apartemen Mewah' },
  { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80', label: 'Modern Minimalist' },
  { url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80', label: 'Tropical Resor' },
];

const VR_PRESETS = [
  { url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=1200&q=80', label: 'Ruang Tamu Skandinavia VR' },
  { url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80', label: 'Kamar Minimalis VR' },
];

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
    vrImage: '',
    features: ''
  });

  const [activeFeatureInput, setActiveFeatureInput] = useState('');
  const [featureList, setFeatureList] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine features from list and split string from any fallback
    const allFeatures = [
      ...featureList,
      ...(formData.features ? formData.features.split(',').map(f => f.trim()).filter(Boolean) : [])
    ];
    
    const uniqueFeatures = Array.from(new Set(allFeatures));

    const newProperty: Property = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: formData.title,
      type: formData.type,
      price: Number(formData.price),
      location: formData.city,
      description: formData.description,
      image: formData.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      vrImage: formData.vrImage,
      rating: 5.0,
      reviews: 0,
      features: uniqueFeatures.length > 0 ? uniqueFeatures : ['Full Furnished', 'Akses Strategis', 'Wi-Fi Cepat'],
      createdAt: new Date().toISOString(),
      ownerId: user?.email
    };

    onAdd(newProperty);
    
    // Reset state
    setFormData({
      title: '',
      type: 'house',
      price: '',
      city: '',
      address: '',
      description: '',
      image: '',
      vrImage: '',
      features: ''
    });
    setFeatureList([]);
    onClose();
  };

  const handleAddFeature = () => {
    if (activeFeatureInput.trim()) {
      if (!featureList.includes(activeFeatureInput.trim())) {
        setFeatureList([...featureList, activeFeatureInput.trim()]);
      }
      setActiveFeatureInput('');
    }
  };

  const handleRemoveFeature = (indexToRemove: number) => {
    setFeatureList(featureList.filter((_, idx) => idx !== indexToRemove));
  };

  // Human-readable Indonesian Rupiah format with scale descriptive suffix (e.g., Miliar, Juta)
  const formatRupiahVerbal = (value: string) => {
    if (!value) return '';
    const num = Number(value);
    if (isNaN(num)) return '';
    
    const formattedNum = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);

    let verbal = '';
    if (num >= 1_000_000_000_000) {
      const t = num / 1_000_000_000_000;
      verbal = `${t.toLocaleString('id-ID', { maximumFractionDigits: 2 })} Triliun`;
    } else if (num >= 1_000_000_000) {
      const m = num / 1_000_000_000;
      verbal = `${m.toLocaleString('id-ID', { maximumFractionDigits: 2 })} Miliar`;
    } else if (num >= 1_000_000) {
      const jt = num / 1_000_000;
      verbal = `${jt.toLocaleString('id-ID', { maximumFractionDigits: 2 })} Juta`;
    } else if (num >= 1_000) {
      const rb = num / 1_000;
      verbal = `${rb.toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ribu`;
    }

    return verbal ? `${formattedNum} (≈ ${verbal})` : formattedNum;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-[4px] transition-opacity"
          />
          <motion.div 
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            className="relative bg-white w-full max-w-3xl rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col h-[94vh] sm:h-auto max-h-[94vh] sm:max-h-[90vh] md:max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                  <span className="p-2 bg-slate-100 text-slate-800 rounded-lg">
                    <Home size={18} />
                  </span>
                  Jual Properti Anda
                </h2>
                <p className="text-xs text-slate-500 mt-1">Daftarkan properti Anda dengan mudah dan jangkau jutaan pembeli potensial.</p>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-slate-100 rounded-full transition-all duration-200 text-slate-400 hover:text-slate-850 bg-slate-50"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-750 bg-slate-50/45 scrollbar-thin">
              
              {/* Properti Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 tracking-wide">Nama Properti</label>
                <input 
                  required
                  type="text" 
                  placeholder="Contoh: Villa Mewah View Sawah Seminyak"
                  className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-slate-850 hover:border-slate-350 focus:ring-1 focus:ring-slate-800 rounded-lg text-sm focus:outline-none bg-white transition-all shadow-sm"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              {/* Property Type Selector (Tactile Custom Interactive Cards) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 tracking-wide">Tipe Properti</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'house' })}
                    className={`p-3.5 flex flex-col items-center justify-center border rounded-xl text-center transition-all ${
                      formData.type === 'house'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Home className="mb-1.5" size={20} />
                    <span className="text-xs font-bold whitespace-nowrap">Rumah / Villa</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'apartment' })}
                    className={`p-3.5 flex flex-col items-center justify-center border rounded-xl text-center transition-all ${
                      formData.type === 'apartment'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Building className="mb-1.5" size={20} />
                    <span className="text-xs font-bold whitespace-nowrap">Apartemen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'hotel' })}
                    className={`p-3.5 flex flex-col items-center justify-center border rounded-xl text-center transition-all ${
                      formData.type === 'hotel'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="mb-1.5" size={20} />
                    <span className="text-xs font-bold whitespace-nowrap">Hotel / Resor</span>
                  </button>
                </div>
              </div>

              {/* Price & Location Group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 tracking-wide">Harga Properti (IDR)</label>
                  <input 
                    required
                    type="number" 
                    placeholder="Contoh: 1500000000"
                    className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-slate-850 hover:border-slate-350 focus:ring-1 focus:ring-slate-800 rounded-lg text-sm focus:outline-none bg-white transition-all shadow-sm"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                  />
                  {formData.price && (
                    <p className="text-xs font-medium text-emerald-600 transition-all pt-0.5 animate-fadeIn">
                      {formatRupiahVerbal(formData.price)}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 tracking-wide">Kota / Wilayah</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Contoh: Badung - Bali, Kebayoran - Jakarta"
                    className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-slate-850 hover:border-slate-350 focus:ring-1 focus:ring-slate-800 rounded-lg text-sm focus:outline-none bg-white transition-all shadow-sm"
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 tracking-wide">Alamat Lengkap</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input 
                    required
                    type="text" 
                    placeholder="Jl. Raya Seminyak Gg. Melati No. 45B..."
                    className="w-full p-2.5 pl-10 border border-slate-200 focus:border-slate-850 hover:border-slate-350 focus:ring-1 focus:ring-slate-800 rounded-lg text-sm focus:outline-none bg-white transition-all shadow-sm"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 tracking-wide">Deskripsi Properti</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Ceritakan keunggulan properti Anda, seperti view pemandangan, posisi hadap barat, dekt objek wisata..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-slate-850 hover:border-slate-350 focus:ring-1 focus:ring-slate-800 rounded-lg text-sm focus:outline-none resize-none bg-white transition-all shadow-sm"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {/* Curated Selectors & Main Image */}
              <div className="space-y-3 pb-2 border-b border-slate-100">
                <label className="text-xs font-semibold text-slate-700 tracking-wide block">Foto Properti</label>
                
                {/* Photo Presets for Quick Choose */}
                <div>
                  <p className="text-[11px] font-medium text-slate-500 mb-2">Pilih cepat foto premium yang kami sediakan untuk melengkapi listing:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PHOTO_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, image: preset.url })}
                        className={`group relative h-16 rounded-lg overflow-hidden border-2 text-left transition-all ${
                          formData.image === preset.url ? 'border-slate-900 ring-2 ring-slate-800/10' : 'border-transparent hover:scale-[1.02]'
                        }`}
                      >
                        <img 
                          src={preset.url} 
                          alt={preset.label} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-end p-1">
                          <span className="text-[9px] text-white font-semibold line-clamp-1">{preset.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual Photo input */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mt-2 pt-2">
                  <div className="w-20 h-20 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
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
                      <Camera size={20} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 w-full relative">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Link URL Foto Tambahan (Opsional)</label>
                    <div className="relative">
                      <Camera size={14} className="absolute left-3 top-3 text-slate-400" />
                      <input 
                        type="url" 
                        placeholder="https://images.unsplash.com/..."
                        className="w-full p-2.5 pl-9 border border-slate-200 focus:border-slate-850 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs focus:outline-none bg-white transition-all shadow-sm"
                        value={formData.image}
                        onChange={e => setFormData({...formData, image: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 360 VR Equirectangular input */}
              <div className="space-y-2 pb-2 border-b border-slate-100">
                <label className="text-xs font-semibold text-slate-700 tracking-wide block">Foto Virtual Tour 360° VR (Opsional)</label>
                
                {/* VR Presets for Quick Selection */}
                <div>
                  <p className="text-[11px] font-medium text-slate-500 mb-2">Simulasi interaktif 360° menggunakan preset pemandangan VR kami:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {VR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, vrImage: preset.url })}
                        className={`group relative h-12 rounded-lg overflow-hidden border-2 text-left transition-all ${
                          formData.vrImage === preset.url ? 'border-slate-900' : 'border-transparent hover:bg-slate-100'
                        }`}
                      >
                        <div className="absolute inset-0 bg-slate-900/40 z-10" />
                        <div className="absolute inset-x-2 top-0 bottom-0 flex items-center justify-between z-20">
                          <div className="flex items-center gap-1.5">
                            <Compass size={13} className="text-white animate-spin-slow" />
                            <span className="text-[10px] font-bold text-white line-clamp-1">{preset.label}</span>
                          </div>
                          {formData.vrImage === preset.url && (
                            <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                          )}
                        </div>
                        <img 
                          src={preset.url} 
                          alt={preset.label} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual VR Link URL */}
                <div className="relative mt-2">
                  <Compass size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="url" 
                    placeholder="https://images.unsplash.com/panorama-image..."
                    className="w-full p-2.5 pl-10 border border-slate-200 focus:border-slate-850 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs focus:outline-none bg-white transition-all shadow-sm"
                    value={formData.vrImage}
                    onChange={e => setFormData({...formData, vrImage: e.target.value})}
                  />
                </div>
              </div>

              {/* Dedicated Features Component (Interactive Add Pill Tags) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 tracking-wide block">Fitur Pendukung Properti</label>
                
                {/* Adding feature list input */}
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Masukkan fitur (misal: Kolam Renang, Rooftop, Parkir Luas)"
                    className="flex-1 px-3.5 py-2 border border-slate-200 focus:border-slate-850 rounded-lg text-sm focus:outline-none bg-white transition-all"
                    value={activeFeatureInput}
                    onChange={e => setActiveFeatureInput(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-extrabold flex items-center gap-1 shadow-sm transition-all text-center"
                  >
                    Tambah <Plus size={14} />
                  </button>
                </div>

                {/* Pill list display */}
                {featureList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {featureList.map((feat, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-700 shadow-sm animate-scaleIn"
                      >
                        {feat}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveFeature(idx)} 
                          className="text-slate-400 hover:text-red-500 rounded-full focus:outline-none p-0.5"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Legacy Fallback list for typing directly */}
                <div className="pt-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Atau Pisahkan dengan Koma (Metode Cepat)</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Kolam Renang, Garansi, Taman Luas, Wi-Fi"
                    className="w-full px-3 py-2 border border-slate-200 focus:border-slate-850 rounded-lg text-xs focus:outline-none bg-white"
                    value={formData.features}
                    onChange={e => setFormData({...formData, features: e.target.value})}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-1/3 py-3 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-lg transition-all text-center"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="w-full sm:w-2/3 bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2 shadow-slate-200"
                >
                  Daftarkan Properti <CheckCircle2 size={16} />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
