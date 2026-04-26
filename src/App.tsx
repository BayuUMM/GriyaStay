import React, { useState, useMemo, useEffect } from 'react';
import Navbar from './components/Navbar';
import CategoryTabs from './components/CategoryTabs';
import PropertyCard from './components/PropertyCard';
import AuthModal from './components/AuthModal';
import SellPropertyModal from './components/SellPropertyModal';
import MyListingsModal from './components/MyListingsModal';
import { mockProperties } from './data/mockData';
import { Property, PropertyType, CartItem, FilterTab } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Star, Shield, CreditCard, Truck, MessageCircle, Search, CheckCircle2, Info, Percent, ShoppingCart, Trash2, QrCode, ArrowRight, Filter, Plus } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

import { useUser } from './context/UserContext';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info';
}

export default function App() {
  const { user } = useUser();
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sortBy, setSortBy] = useState<'related' | 'newest' | 'bestseller' | 'price-low' | 'price-high'>('related');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isMyListingsOpen, setIsMyListingsOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [bookingDuration, setBookingDuration] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isQRReady, setIsQRReady] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<CartItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'griyastay' | 'bank' | 'ewallet' | 'qris'>('griyastay');
  const bannerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const banner = bannerRef.current;
    if (!banner) return;

    let interval: NodeJS.Timeout;
    
    const startAutoSlide = () => {
      interval = setInterval(() => {
        if (banner) {
          const slideWidth = banner.offsetWidth * 0.9; // Approximate width of one slide (90vw)
          const maxScroll = banner.scrollWidth - banner.offsetWidth;
          
          if (banner.scrollLeft >= maxScroll - 10) {
            banner.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            banner.scrollTo({ left: banner.scrollLeft + slideWidth + 12, behavior: 'smooth' }); // 12 is gap
          }
        }
      }, 5000);
    };

    startAutoSlide();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      // Direct assignment for common test properties to ensure ownerId is set
      setProperties(prev => {
        const ownedIds = ['h1', 'h3', 'h4', 'h5'];
        const needsUpdate = prev.some(p => ownedIds.includes(p.id) && p.ownerId !== user.email);
        if (needsUpdate) {
          return prev.map(p => 
            ownedIds.includes(p.id) ? { ...p, ownerId: user.email } : p
          );
        }
        return prev;
      });
    }
  }, [user]);

  const locations = useMemo(() => {
    const locs = properties.map(p => {
      const parts = p.location.split(', ');
      return parts[parts.length - 1];
    });
    return ['all', ...Array.from(new Set(locs))].sort();
  }, [properties]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0, house: 0, hotel: 0, apartment: 0, promo: 0, near: 0, mine: 0 };
    
    properties.forEach(p => {
      const matchesLocation = selectedLocation === 'all' || p.location.includes(selectedLocation);
      if (matchesLocation) {
        counts.all++;
        if (p.type === 'house') counts.house++;
        if (p.type === 'hotel') counts.hotel++;
        if (p.type === 'apartment') counts.apartment++;
        if (p.isPromo) counts.promo++;
        if (user && p.ownerId === user.email) counts.mine++;
        counts.near++;
      }
    });
    
    return counts;
  }, [properties, selectedLocation, user]);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setBookingDuration(1); // Reset duration when opening new property
  };

  const handleAddProperty = (newProperty: Property) => {
    setProperties(prev => [newProperty, ...prev]);
    setIsSellModalOpen(false);
    addToast('Properti Anda berhasil didaftarkan!', 'success');
  };

  const addToCart = (property: Property, duration: number) => {
    if (!user) {
      openAuth('login');
      addToast('Silakan login terlebih dahulu untuk memesan', 'info');
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.id === property.id);
      if (existing) {
        return prev.map(item => 
          item.id === property.id ? { ...item, duration: item.duration + duration } : item
        );
      }
      const newItem: CartItem = {
        ...property,
        quantity: 1,
        duration: duration
      };
      return [...prev, newItem];
    });
    
    setSelectedProperty(null);
    addToast('Berhasil ditambahkan ke keranjang!');
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
    addToast('Dihapus dari keranjang', 'info');
  };

  const handleCheckout = (item: CartItem) => {
    if (!user) {
      openAuth('login');
      addToast('Silakan login terlebih dahulu untuk checkout', 'info');
      return;
    }
    setCurrentOrder(item);
    setIsCartOpen(false);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsPaymentOpen(false);
    setIsQRReady(true);
    // Remove from cart if it was there
    if (currentOrder) {
      setCart(prev => prev.filter(item => item.id !== currentOrder.id));
    }
  };

  const handleChatAgen = (propertyTitle: string) => {
    const message = `Halo, saya tertarik dengan properti: ${propertyTitle}. Bisa minta info lebih lanjut?`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/6281344442838?text=${encodedMessage}`, '_blank');
  };

  const addToast = (message: string, type: 'success' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const myListings = useMemo(() => {
    if (!user) return [];
    const owned = properties.filter(p => p.ownerId === user.email);
    console.log('Calculating My Listings for', user.email, 'Count:', owned.length);
    return owned;
  }, [properties, user]);

  const handleDeleteProperty = (id: string) => {
    setProperties(prev => {
      const propertyToDelete = prev.find(p => p.id === id);
      if (propertyToDelete) {
        addToast(`"${propertyToDelete.title}" berhasil dihapus dari GriyaStay.`, 'info');
      }
      return prev.filter(p => p.id !== id);
    });
    
    // Safety check for detail modal
    if (selectedProperty && selectedProperty.id === id) {
      setSelectedProperty(null);
    }
  };

  const filteredProperties = useMemo(() => {
    let result = properties.filter(p => {
      const matchesTab = 
        activeTab === 'all' || 
        activeTab === 'near' || // Near is mocked to show all for now
        (activeTab === 'mine' ? (user && p.ownerId === user.email) : 
         activeTab === 'promo' ? p.isPromo : p.type === activeTab);
      
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLocation = selectedLocation === 'all' || p.location.includes(selectedLocation);

      return matchesTab && matchesSearch && matchesLocation;
    });

    // Apply Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'bestseller') {
        return b.reviews - a.reviews;
      }
      if (sortBy === 'price-low') {
        return a.price - b.price;
      }
      if (sortBy === 'price-high') {
        return b.price - a.price;
      }
      return 0; // 'related' or default
    });
  }, [activeTab, searchQuery, sortBy, properties, user, selectedLocation]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFav = favorites.includes(id);
    setFavorites(prev => 
      isFav ? prev.filter(favId => favId !== id) : [...prev, id]
    );
    addToast(isFav ? 'Dihapus dari favorit' : 'Ditambahkan ke favorit', isFav ? 'info' : 'success');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar 
        onSearch={setSearchQuery} 
        favoriteCount={favorites.length} 
        cartCount={cart.length}
        onOpenAuth={openAuth} 
        onOpenCart={() => setIsCartOpen(true)}
        onShowMyListings={() => {
          if (!user) {
            openAuth('login');
          } else {
            setIsMyListingsOpen(true);
          }
        }}
      />
      
      {/* Toast Container */}
      <div className="fixed top-24 right-4 z-[200] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`flex items-center gap-2 px-4 py-3 rounded-sm shadow-xl border-l-4 ${
                toast.type === 'success' ? 'bg-white border-emerald-500 text-slate-800' : 'bg-white border-blue-500 text-slate-800'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Info size={18} className="text-blue-500" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <main className="flex-1 pb-20">
        {/* Banner Section */}
        <div className="bg-white py-4 md:py-6 mb-4 md:mb-6 border-b border-slate-100 overflow-hidden">
          <div 
            ref={bannerRef}
            className="max-w-7xl mx-auto px-4 flex overflow-x-auto pb-4 sm:pb-0 gap-3 md:gap-4 snap-x snap-mandatory sm:grid sm:grid-cols-3 scrollbar-hide"
          >
            {/* Main Hero Banner */}
            <div className="min-w-[90vw] sm:min-w-0 sm:col-span-2 rounded-sm overflow-hidden h-[250px] md:h-[400px] relative group cursor-pointer shadow-sm bg-slate-200 snap-center">
              <img 
                src="https://images.unsplash.com/photo-1549463512-23c28a994760?auto=format&fit=crop&w=1200&q=80" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                alt="Banner 1"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent flex flex-col justify-end p-6 md:p-12 text-white">
                <div className="mb-2 flex items-center gap-2">
                  <span className="bg-yellow-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-sm">EXCLUSIVE</span>
                  <span className="text-[10px] font-bold tracking-widest text-slate-100/70 uppercase">Indonesia</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-black mb-2 md:mb-4 font-display leading-none tracking-tight">Eksplorasi Hunian<br/>Impian Anda.</h2>
                <p className="text-sm md:text-lg text-slate-100/80 mb-4 md:mb-8 max-w-xs md:max-w-md font-medium">Temukan properti eksklusif dan hotel terbaik di seluruh penjuru Indonesia.</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => addToast('Voucher diskon berhasil diklaim!')}
                    className="bg-white text-slate-900 px-6 md:px-10 py-2.5 md:py-4 rounded-sm font-black w-fit hover:bg-slate-50 transition-all shadow-2xl text-xs md:text-sm uppercase tracking-widest"
                  >
                    Mulai Eksplorasi
                  </button>
                  <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 md:px-10 py-2.5 md:py-4 rounded-sm font-bold w-fit hover:bg-white/20 transition-all text-xs md:text-sm uppercase tracking-widest">
                    Lihat Promo
                  </button>
                </div>
              </div>
            </div>

            <div className="contents sm:flex sm:flex-col gap-3 md:gap-4">
              {/* Side Promotion Banners */}
              <div className="rounded-sm overflow-hidden relative group cursor-pointer shadow-sm h-[250px] sm:h-auto sm:flex-1 bg-slate-200 min-w-[90vw] sm:min-w-0 snap-center">
                <img 
                  src="https://images.unsplash.com/photo-1596422846543-75c6fc18a593?auto=format&fit=crop&w=800&q=80" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  alt="Banner 2"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-end p-6 md:p-6 text-white">
                  <h3 className="font-black text-xl md:text-xl leading-tight">Staycation di Jakarta</h3>
                  <p className="text-xs md:text-sm text-slate-100/70 font-medium">Penawaran Paket Terbatas</p>
                </div>
              </div>

              <div className="rounded-sm overflow-hidden relative group cursor-pointer shadow-sm h-[250px] sm:h-auto sm:flex-1 bg-slate-200 min-w-[90vw] sm:min-w-0 snap-center">
                <img 
                  src="https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  alt="Banner 3"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-end p-6 md:p-6 text-white">
                  <h3 className="font-black text-xl md:text-xl leading-tight">Bali Beachfront</h3>
                  <p className="text-xs md:text-sm text-slate-100/70 font-medium">Hemat hingga 30%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CategoryTabs 
          activeTab={activeTab as any} 
          onTabChange={setActiveTab as any} 
          counts={categoryCounts}
        />

        {/* Location Filter Summary */}
        <div className="max-w-7xl mx-auto px-4 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Destinasi Populer di Indonesia</h3>
              <button 
                onClick={() => {
                  setSelectedLocation('all');
                }}
                className="text-[10px] font-bold text-blue-500 hover:text-blue-600 transition-colors uppercase tracking-widest"
              >
                Reset Filter
              </button>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-2">
              <div className="flex items-center gap-2 bg-white p-1 rounded-sm shadow-sm border border-slate-100">
                <button 
                  onClick={() => {
                    if (navigator.geolocation) {
                      addToast('Mendeteksi lokasi Anda...', 'info');
                      navigator.geolocation.getCurrentPosition((position) => {
                        setSelectedLocation('Jakarta');
                        addToast('Lokasi terdeteksi: Jakarta', 'success');
                      }, () => {
                        addToast('Gagal mendeteksi lokasi', 'info');
                      });
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-sm bg-slate-900 text-white text-[10px] md:text-xs font-black shadow-md hover:bg-slate-800 transition-all whitespace-nowrap"
                >
                  <MapPin size={14} className="text-sky-400" />
                  SEKITAR SAYA
                </button>
              </div>
              <div className="w-px h-8 bg-slate-200 mx-2" />
              <button
                onClick={() => setSelectedLocation('all')}
                className={`px-5 py-2.5 rounded-sm text-[10px] md:text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedLocation === 'all' 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                }`}
              >
                🇮🇩 SEMUA WILAYAH
              </button>
              {locations.filter(l => l !== 'all').map((loc) => (
                <button
                  key={loc}
                  onClick={() => setSelectedLocation(loc)}
                  className={`px-5 py-2.5 rounded-sm text-[10px] md:text-xs font-bold whitespace-nowrap transition-all border ${
                    selectedLocation === loc 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                      : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                  }`}
                >
                  📍 {loc.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white p-3 md:p-4 rounded-sm shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 md:gap-4 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 whitespace-nowrap">Filter & Urutkan:</span>
                {selectedLocation !== 'all' && (
                  <button 
                    onClick={() => setSelectedLocation('all')}
                    className="text-[10px] text-red-500 font-bold hover:underline whitespace-nowrap"
                  >
                    (Hapus Filter)
                  </button>
                )}
              </div>
              
              {/* Location Filter */}
              <div className="relative">
                <select 
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className={`bg-white border px-3 md:px-4 py-1.5 rounded-sm text-[11px] md:text-sm focus:outline-none transition-colors cursor-pointer capitalize ${selectedLocation !== 'all' ? 'border-gray-800 text-gray-900 font-medium' : 'border-gray-200'}`}
                >
                  <option value="all">Semua Wilayah</option>
                  {locations.filter(l => l !== 'all').map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="w-px h-4 bg-gray-200 hidden md:block" />

              <button 
                onClick={() => setSortBy('related')}
                className={`px-3 md:px-4 py-1.5 rounded-sm text-[11px] md:text-sm whitespace-nowrap transition-colors ${sortBy === 'related' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 hover:border-gray-400'}`}
              >
                Terkait
              </button>
              <button 
                onClick={() => setSortBy('newest')}
                className={`px-3 md:px-4 py-1.5 rounded-sm text-[11px] md:text-sm whitespace-nowrap transition-colors ${sortBy === 'newest' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 hover:border-gray-400'}`}
              >
                Terbaru
              </button>
              <button 
                onClick={() => setSortBy('bestseller')}
                className={`px-3 md:px-4 py-1.5 rounded-sm text-[11px] md:text-sm whitespace-nowrap transition-colors ${sortBy === 'bestseller' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 hover:border-gray-400'}`}
              >
                Terlaris
              </button>
              <select 
                value={sortBy.startsWith('price') ? sortBy : 'price'}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`bg-white border px-3 md:px-4 py-1.5 rounded-sm text-[11px] md:text-sm focus:outline-none transition-colors ${sortBy.startsWith('price') ? 'border-gray-800 text-gray-900 font-medium' : 'border-gray-200'}`}
              >
                <option value="price" disabled>Harga</option>
                <option value="price-low">Rendah ke Tinggi</option>
                <option value="price-high">Tinggi ke Rendah</option>
              </select>
            </div>
            {searchQuery && (
              <div className="text-xs md:text-sm text-gray-500 italic">
                Hasil untuk "<span className="text-gray-900 font-medium">{searchQuery}</span>"
              </div>
            )}
          </div>

          {filteredProperties.length > 0 ? (
            <div className="flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-6 scrollbar-hide">
              {filteredProperties.map(property => (
                <div key={property.id} className="min-w-[280px] w-[90vw] sm:w-full sm:min-w-0 snap-center">
                  <PropertyCard 
                    property={property} 
                    isFavorite={favorites.includes(property.id)}
                    onFavoriteToggle={(e) => toggleFavorite(property.id, e)}
                    onClick={handlePropertyClick}
                    isOwner={user && property.ownerId === user.email}
                    onDelete={(id, e) => {
                      handleDeleteProperty(id);
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 md:p-20 text-center rounded-sm shadow-sm border border-gray-100">
              <Search size={48} className="mx-auto opacity-10 mb-4" />
              <h3 className="text-base md:text-lg font-medium text-gray-600">Properti tidak ditemukan</h3>
              <p className="text-xs md:text-sm text-gray-400">Coba kata kunci lain atau ubah filter Anda.</p>
            </div>
          )}
        </div>
      </main>

      {/* Property Detail Modal */}
      <AnimatePresence>
        {selectedProperty && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProperty(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto rounded-sm relative z-10 shadow-2xl scrollbar-hide"
            >
              <button 
                onClick={() => setSelectedProperty(null)}
                className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full text-gray-800 z-20 transition-colors shadow-md"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col md:grid md:grid-cols-2">
                <div className="h-[250px] sm:h-[350px] md:h-auto overflow-hidden bg-slate-100">
                  <img 
                    src={selectedProperty.image} 
                    alt={selectedProperty.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                </div>
                <div className="p-5 md:p-8">
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    {selectedProperty.isPromo && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1">
                        <Percent size={10} /> PROMO
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm text-white ${selectedProperty.type === 'house' ? 'bg-gray-800' : 'bg-gray-500'}`}>
                      {selectedProperty.type === 'house' ? 'DIJUAL' : 'HOTEL'}
                    </span>
                    <span className="text-gray-400 text-[10px]">ID: {selectedProperty.id}</span>
                  </div>
                  
                  <h2 className="text-xl md:text-2xl font-bold mb-2 font-display text-gray-900 leading-tight">{selectedProperty.title}</h2>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1 text-gray-900 text-sm">
                      <Star size={14} fill="currentColor" />
                      <span className="font-bold underline">{selectedProperty.rating}</span>
                    </div>
                    <div className="w-px h-3 bg-gray-200" />
                    <div className="text-gray-500 text-sm underline">{selectedProperty.reviews} Penilaian</div>
                  </div>

                  <div className="bg-gray-50 p-4 md:p-6 rounded-sm mb-6 border border-gray-100">
                    <div className="text-2xl md:text-3xl font-bold text-gray-900">
                      {formatPrice(selectedProperty.price * (selectedProperty.type === 'hotel' ? bookingDuration : 1))}
                      {selectedProperty.type === 'hotel' && <span className="text-xs md:text-sm font-normal text-gray-500"> / {bookingDuration} malam</span>}
                    </div>
                  </div>

                  {selectedProperty.type === 'hotel' && (
                    <div className="mb-6">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Durasi Menginap</label>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 7, 14, 30].map((days) => (
                          <button
                            key={days}
                            onClick={() => setBookingDuration(days)}
                            className={`px-4 py-2 rounded-sm text-xs font-medium transition-all border ${
                              bookingDuration === days 
                                ? 'bg-gray-800 text-white border-gray-800 shadow-md' 
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                            }`}
                          >
                            {days === 7 ? '1 Minggu' : days === 14 ? '2 Minggu' : days === 30 ? '1 Bulan' : `${days} Hari`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 mb-8">
                    <div className="flex items-start gap-2 text-gray-600 text-sm">
                      <MapPin size={16} className="text-gray-800 mt-0.5 shrink-0" />
                      <span>{selectedProperty.location}</span>
                    </div>
                    <div className="flex items-start gap-2 text-gray-600 text-sm">
                      <Shield size={16} className="text-gray-800 mt-0.5 shrink-0" />
                      <span>Garansi GriyaStay: Unit sesuai foto atau uang kembali 100%.</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {user && selectedProperty.ownerId === user.email && (
                      <button 
                        onClick={() => {
                          handleDeleteProperty(selectedProperty.id);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-red-600 text-white border border-red-700 py-3 rounded-sm hover:bg-red-700 transition-all font-bold mb-2 shadow-lg"
                      >
                        <Trash2 size={18} /> Berhenti Menjual & Hapus
                      </button>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={() => handleChatAgen(selectedProperty.title)}
                        className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-2.5 md:py-3 rounded-sm hover:bg-gray-50 transition-colors font-medium text-sm md:text-base"
                      >
                        <MessageCircle size={18} /> Chat Agen
                      </button>
                      <button 
                        onClick={() => addToCart(selectedProperty, bookingDuration)}
                        className="flex-1 bg-gray-800 text-white py-2.5 md:py-3 rounded-sm hover:bg-black transition-colors font-bold shadow-lg shadow-gray-200 text-sm md:text-base"
                      >
                        {selectedProperty.type === 'house' ? 'Ajukan KPR' : 'Booking Sekarang'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-8 border-t border-gray-100 bg-gray-50/30">
                <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4 text-gray-900">Deskripsi Properti</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-6 md:mb-8">
                  {selectedProperty.description}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                  <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-100">
                    <h4 className="font-bold mb-3 text-[10px] text-gray-400 uppercase tracking-widest">Fitur Utama</h4>
                    <ul className="grid grid-cols-1 gap-2">
                      {selectedProperty.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs md:text-sm text-gray-700">
                          <CheckCircle2 size={14} className="text-gray-400 shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {selectedProperty.amenities && (
                    <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-100">
                      <h4 className="font-bold mb-3 text-[10px] text-gray-400 uppercase tracking-widest">Fasilitas</h4>
                      <ul className="grid grid-cols-1 gap-2">
                        {selectedProperty.amenities.map((a, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs md:text-sm text-gray-700">
                            <CheckCircle2 size={14} className="text-gray-400 shrink-0" /> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="bg-white border-t border-gray-200 py-8 md:py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <div>
            <h4 className="font-bold mb-3 md:mb-4 text-[11px] md:text-sm uppercase text-gray-900">Layanan</h4>
            <ul className="space-y-1.5 md:space-y-2 text-[10px] md:text-xs text-gray-500">
              <li className="hover:text-gray-900 cursor-pointer transition-colors">Bantuan</li>
              <li className="hover:text-gray-900 cursor-pointer transition-colors">Pembayaran</li>
              <li className="hover:text-gray-900 cursor-pointer transition-colors">GriyaStay Pay</li>
              <li className="hover:text-gray-900 cursor-pointer transition-colors">Hubungi Kami</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3 md:mb-4 text-[11px] md:text-sm uppercase text-gray-900">Tentang</h4>
            <ul className="space-y-1.5 md:space-y-2 text-[10px] md:text-xs text-gray-500">
              <li className="hover:text-gray-900 cursor-pointer transition-colors">Tentang Kami</li>
              <li className="hover:text-gray-900 cursor-pointer transition-colors">Karir</li>
              <li className="hover:text-gray-900 cursor-pointer transition-colors">Kebijakan</li>
              <li className="hover:text-gray-900 cursor-pointer transition-colors">Blog</li>
            </ul>
          </div>
          <div className="col-span-1">
            <h4 className="font-bold mb-3 md:mb-4 text-[11px] md:text-sm uppercase text-gray-900">Pembayaran</h4>
            <div className="flex flex-wrap gap-2">
              <div className="bg-gray-100 p-1.5 md:p-2 rounded hover:bg-gray-200 cursor-pointer transition-colors"><CreditCard size={16} /></div>
              <div className="bg-gray-100 p-1.5 md:p-2 rounded hover:bg-gray-200 cursor-pointer transition-colors"><Shield size={16} /></div>
              <div className="bg-gray-100 p-1.5 md:p-2 rounded hover:bg-gray-200 cursor-pointer transition-colors"><Truck size={16} /></div>
            </div>
          </div>
          <div className="col-span-1">
            <h4 className="font-bold mb-3 md:mb-4 text-[11px] md:text-sm uppercase text-gray-900">Ikuti Kami</h4>
            <div className="flex flex-col gap-1.5 md:gap-2 text-[10px] md:text-xs text-gray-500">
              <span className="cursor-pointer hover:text-gray-900 transition-colors">Facebook</span>
              <span className="cursor-pointer hover:text-gray-900 transition-colors">Instagram</span>
              <span className="cursor-pointer hover:text-gray-900 transition-colors">Twitter</span>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-100 text-center text-[10px] text-gray-400">
          © 2026 GriyaStay. Hak Cipta Dilindungi oleh Bayu Febryan Palolongi.
        </div>
      </footer>
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode={authMode} 
      />

      {/* Cart Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ShoppingCart size={20} /> Keranjang Saya
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <ShoppingCart size={48} className="opacity-20 mb-4" />
                    <p>Keranjang Anda masih kosong</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-sm border border-gray-100 group">
                      <div className="w-20 h-20 bg-slate-100 rounded-sm overflow-hidden shrink-0">
                        <img 
                          src={item.image} 
                          className="w-full h-full object-cover" 
                          alt={item.title} 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{item.title}</h4>
                        <p className="text-[10px] text-gray-500 mb-1">{item.location}</p>
                        <p className="text-xs font-bold text-gray-900">
                          {formatPrice(item.price * item.duration)}
                          <span className="text-[10px] font-normal text-gray-500"> / {item.duration} malam</span>
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleCheckout(item)}
                            className="bg-gray-800 text-white px-3 py-1 rounded-sm text-[10px] font-bold hover:bg-black transition-colors"
                          >
                            Checkout
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentOpen && currentOrder && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-lg rounded-sm shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CreditCard size={24} /> Pembayaran
                </h2>
                <button onClick={() => setIsPaymentOpen(false)} className="p-2 hover:bg-gray-200 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-sm">
                  <h4 className="text-sm font-bold text-blue-900 mb-1">Ringkasan Pesanan</h4>
                  <p className="text-xs text-blue-800">{currentOrder.title}</p>
                  <p className="text-xs text-blue-800">{currentOrder.duration} Malam</p>
                  <div className="mt-2 pt-2 border-t border-blue-200 flex justify-between items-center">
                    <span className="text-sm font-bold text-blue-900">Total Tagihan:</span>
                    <span className="text-lg font-bold text-blue-900">{formatPrice(currentOrder.price * currentOrder.duration)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Metode Pembayaran</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      onClick={() => setPaymentMethod('griyastay')}
                      className={`p-3 rounded-sm flex items-center gap-2 cursor-pointer transition-all border-2 ${paymentMethod === 'griyastay' ? 'border-gray-800 bg-gray-50' : 'border-gray-100 hover:border-gray-300'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'griyastay' ? 'border-gray-800' : 'border-gray-300'}`}>
                        {paymentMethod === 'griyastay' && <div className="w-2 h-2 bg-gray-800 rounded-full" />}
                      </div>
                      <span className="text-xs font-bold">GriyaStay Pay</span>
                    </div>
                    <div 
                      onClick={() => setPaymentMethod('bank')}
                      className={`p-3 rounded-sm flex items-center gap-2 cursor-pointer transition-all border-2 ${paymentMethod === 'bank' ? 'border-gray-800 bg-gray-50' : 'border-gray-100 hover:border-gray-300'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'bank' ? 'border-gray-800' : 'border-gray-300'}`}>
                        {paymentMethod === 'bank' && <div className="w-2 h-2 bg-gray-800 rounded-full" />}
                      </div>
                      <span className="text-xs font-bold">Transfer Bank</span>
                    </div>
                    <div 
                      onClick={() => setPaymentMethod('ewallet')}
                      className={`p-3 rounded-sm flex items-center gap-2 cursor-pointer transition-all border-2 ${paymentMethod === 'ewallet' ? 'border-gray-800 bg-gray-50' : 'border-gray-100 hover:border-gray-300'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'ewallet' ? 'border-gray-800' : 'border-gray-300'}`}>
                        {paymentMethod === 'ewallet' && <div className="w-2 h-2 bg-gray-800 rounded-full" />}
                      </div>
                      <span className="text-xs font-bold">E-Wallet (OVO/Gopay)</span>
                    </div>
                    <div 
                      onClick={() => setPaymentMethod('qris')}
                      className={`p-3 rounded-sm flex items-center gap-2 cursor-pointer transition-all border-2 ${paymentMethod === 'qris' ? 'border-gray-800 bg-gray-50' : 'border-gray-100 hover:border-gray-300'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'qris' ? 'border-gray-800' : 'border-gray-300'}`}>
                        {paymentMethod === 'qris' && <div className="w-2 h-2 bg-gray-800 rounded-full" />}
                      </div>
                      <span className="text-xs font-bold">QRIS</span>
                    </div>
                  </div>
                </div>

                {paymentMethod === 'qris' ? (
                  <div className="mt-6 p-4 bg-gray-50 rounded-sm text-center border border-gray-200">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Scan QRIS Untuk Membayar</p>
                    <div className="bg-white p-3 inline-block rounded-sm shadow-sm border border-gray-100 mb-3">
                      <QRCodeSVG value="https://griyastay.com/pay/qris/simulated" size={120} />
                    </div>
                    <p className="text-[10px] text-gray-500 italic">Silakan scan menggunakan aplikasi bank atau e-wallet Anda</p>
                  </div>
                ) : paymentMethod === 'bank' ? (
                  <div className="mt-6 p-4 bg-gray-50 rounded-sm border border-gray-200">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Nomor Rekening Tujuan</p>
                    <div className="flex justify-between items-center bg-white p-3 rounded-sm border border-gray-100">
                      <div>
                        <p className="text-[10px] text-gray-400">Bank BCA (GriyaStay)</p>
                        <p className="font-mono font-bold text-gray-900">8830 1234 5678</p>
                      </div>
                      <button className="text-[10px] font-bold text-blue-600 hover:underline">Salin</button>
                    </div>
                  </div>
                ) : null}

                <button 
                  onClick={handlePaymentSuccess}
                  className="w-full bg-gray-900 text-white py-4 rounded-sm font-bold mt-8 hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  {paymentMethod === 'qris' ? 'Saya Sudah Bayar' : 'Bayar Sekarang'} <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {isQRReady && currentOrder && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="relative bg-white w-full max-w-sm rounded-xl shadow-2xl p-6 text-center"
            >
              <button 
                onClick={() => {
                  setIsQRReady(false);
                  setCurrentOrder(null);
                }}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Pembayaran Berhasil!</h2>
              <p className="text-xs text-gray-500 mb-6">Tunjukkan QR Code ini kepada resepsionis saat check-in di lobi hotel.</p>
              
              <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-200 inline-block mb-6">
                <QRCodeSVG 
                  value={`BOOKING-${currentOrder.id}-${Date.now()}`} 
                  size={160}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="text-left bg-gray-50 p-3 rounded-lg mb-6">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Properti:</span>
                  <span className="font-bold text-gray-900">{currentOrder.title}</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">ID Pesanan:</span>
                  <span className="font-mono font-bold text-gray-900">GS-{currentOrder.id.toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-green-600 font-bold">LUNAS</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  setIsQRReady(false);
                  setCurrentOrder(null);
                }}
                className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-bold hover:bg-black transition-colors mb-3"
              >
                Selesai
              </button>

              <button 
                onClick={() => {
                  setIsQRReady(false);
                  setCurrentOrder(null);
                }}
                className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
              >
                Kembali ke Beranda
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sell Property FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          if (!user) {
            openAuth('login');
            addToast('Silakan login terlebih dahulu untuk menjual properti', 'info');
          } else {
            setIsSellModalOpen(true);
          }
        }}
        className="fixed bottom-6 right-6 z-[100] bg-gray-800 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 hover:bg-black transition-all group"
      >
        <Plus size={24} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap font-bold text-sm">
          Jual Properti
        </span>
      </motion.button>

      <SellPropertyModal 
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        onAdd={handleAddProperty}
      />

      <MyListingsModal 
        isOpen={isMyListingsOpen}
        onClose={() => setIsMyListingsOpen(false)}
        listings={myListings}
        onDelete={handleDeleteProperty}
      />
    </div>
  );
}
