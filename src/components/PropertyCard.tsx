import React from "react";
import { Property } from "../types";
import {
  MapPin,
  Star,
  Bed,
  Bath,
  Square,
  Heart,
  Trash2,
  Share2,
  Link2,
  Instagram,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useUser } from "../context/UserContext";

interface PropertyCardProps {
  property: Property;
  onClick: (property: Property) => void;
  isFavorite: boolean;
  onFavoriteToggle: (e: React.MouseEvent) => void;
  onShare?: (property: Property) => void;
  onOpenVR?: (property: Property) => void;
  isOwner?: boolean;
  onDelete?: (id: string, e: React.MouseEvent) => void;
}

export default function PropertyCard({
  property,
  onClick,
  isFavorite,
  onFavoriteToggle,
  onShare,
  onOpenVR,
  isOwner,
  onDelete,
}: PropertyCardProps) {
  const { user } = useUser();
  const [showShareMenu, setShowShareMenu] = React.useState(false);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);

  const handleShare = (platform: "link" | "wa" | "ig") => {
    const url = `${window.location.origin}/property/${property.id}`;
    const text = `Cek properti menarik ini: ${property.title}`;

    if (platform === "link") {
      navigator.clipboard.writeText(url);
      onShare?.(property);
    } else if (platform === "wa") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
        "_blank",
      );
    } else if (platform === "ig") {
      window.open(`https://instagram.com`, "_blank");
    }

    setShowShareMenu(false);
  };

  // 🔥 IMPORTANT FIX: jangan izinkan aksi owner kalau user null
  const isActuallyOwner = user?.email && property.ownerId === user.email;

  return (
    <motion.div
      onClick={() => onClick(property)}
      className="bg-white rounded-sm overflow-hidden cursor-pointer group border border-slate-100 hover:shadow-xl"
      whileHover={{ y: -6 }}
    >
      {/* IMAGE */}
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";
          }}
        />

        {/* FAVORITE */}
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle(e);
            }}
            className={`p-2 rounded-full ${
              isFavorite
                ? "bg-rose-500 text-white"
                : "bg-white/80 text-slate-400"
            }`}
          >
            <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>

        {/* SHARE */}
        <div className="absolute top-12 right-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowShareMenu(!showShareMenu);
            }}
            className="p-2 bg-white/80 rounded-full"
          >
            <Share2 size={14} />
          </button>

          <AnimatePresence>
            {showShareMenu && (
              <motion.div className="absolute right-10 top-0 bg-white p-2 flex gap-2 rounded-sm shadow-xl">
                <button onClick={() => handleShare("wa")}>
                  <MessageCircle size={16} />
                </button>
                <button onClick={() => handleShare("ig")}>
                  <Instagram size={16} />
                </button>
                <button onClick={() => handleShare("link")}>
                  <Link2 size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* DELETE FIX */}
        {isActuallyOwner && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(property.id, e);
            }}
            className="absolute top-1/2 right-3 -translate-y-1/2 p-2 bg-red-500 text-white rounded-full"
          >
            <Trash2 size={14} />
          </button>
        )}

        <div className="absolute bottom-2 left-3 text-white text-[10px]">
          <MapPin size={10} className="inline" /> {property.location}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4">
        <h3 className="font-bold">{property.title}</h3>
        <p className="text-xs text-slate-500 line-clamp-2">
          {property.description}
        </p>

        <div className="mt-2 font-black">{formatPrice(property.price)}</div>

        <div className="flex items-center gap-2 text-xs mt-2">
          <Star size={12} className="text-yellow-500" />
          {property.rating}
        </div>
      </div>
    </motion.div>
  );
}
