import React from 'react';
import { Property } from '../types';
import { MapPin, Star, Bed, Bath, Square, Heart, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface PropertyCardProps {
  property: Property;
  onClick: (property: Property) => void;
  isFavorite: boolean;
  onFavoriteToggle: (e: React.MouseEvent) => void;
  isOwner?: boolean;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  key?: string | number;
}

export default function PropertyCard({ 
  property, 
  onClick, 
  isFavorite, 
  onFavoriteToggle,
  isOwner,
  onDelete 
}: PropertyCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="bg-white rounded-sm overflow-hidden cursor-pointer group border border-slate-100/50 hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300"
      onClick={() => onClick(property)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
        <img 
          src={property.image} 
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'; // Fallback to a nice house image
          }}
        />
        
        {/* Overlay Gradients */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-900/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {property.isPromo && (
            <div className="bg-yellow-400 text-slate-900 text-[9px] font-black px-2 py-0.5 rounded-sm uppercase shadow-lg flex items-center gap-1">
              EXCLUSIVE
            </div>
          )}
          <div className={`text-white text-[9px] font-black px-2 py-0.5 rounded-sm uppercase shadow-lg flex items-center gap-1 ${
            property.type === 'hotel' ? 'bg-rose-500' : property.type === 'house' ? 'bg-slate-900' : 'bg-blue-600'
          }`}>
            {property.type === 'hotel' ? 'Booking' : property.type === 'house' ? 'Sale' : 'Apartment'}
          </div>
        </div>
        
        <button 
          onClick={onFavoriteToggle}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all shadow-md backdrop-blur-md ${
            isFavorite ? 'bg-rose-500 text-white' : 'bg-white/80 text-slate-400 hover:bg-white hover:text-slate-900'
          }`}
        >
          <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>

        {isOwner && onDelete && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(property.id, e);
            }}
            className="absolute top-3 right-14 p-2 bg-white/80 text-slate-400 hover:bg-red-500 hover:text-white rounded-full transition-all shadow-md backdrop-blur-md"
            title="Hapus Iklan"
          >
            <Trash2 size={14} />
          </button>
        )}

        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-1.5 text-white/90 text-[10px] font-bold">
            <MapPin size={10} className="text-yellow-400" />
            <span className="truncate">{property.location.split(', ').pop()}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
          {property.title}
        </h3>
        
        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3 h-8">
          {property.description}
        </p>

        <div className="flex items-center justify-between items-end">
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Price</div>
            <div className="text-slate-900 font-black text-sm">
              {formatPrice(property.price)}
              {property.type === 'hotel' && <span className="text-[8px] font-bold text-slate-400">/NT</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-sm">
            <Star size={10} fill="currentColor" className="text-yellow-500" />
            <span className="text-[10px] font-black text-slate-900">{property.rating}</span>
          </div>
        </div>

        {(property.type === 'house' || property.type === 'apartment') && (
          <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                <Bed size={12} className="text-slate-300" /> {property.bedrooms}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                <Bath size={12} className="text-slate-300" /> {property.bathrooms}
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black text-slate-400">
              <Square size={10} className="text-slate-300" /> {property.sqft} M²
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
