import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  Globe,
  MapPin,
} from "lucide-react";
import { Property } from "../types";
import { useUser } from "../context/UserContext";

interface MyListingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  listings: Property[];
  onDelete: (id: string) => void;
}

export default function MyListingsModal({
  isOpen,
  onClose,
  listings,
  onDelete,
}: MyListingsModalProps) {
  const { user, loading } = useUser();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState("all");

  // 🔥 FIX 1: guard login
  if (!loading && !user) {
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60">
            <div className="bg-white p-6 rounded-sm text-center">
              <p className="font-bold mb-2">Harus login dulu</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 text-white rounded-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  const locations = useMemo(() => {
    const set = new Set(
      listings.map((l) => {
        const parts = l.location.split(", ");
        return parts[parts.length - 1];
      }),
    );
    return ["all", ...Array.from(set)].sort();
  }, [listings]);

  const filteredListings = useMemo(() => {
    return listings.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLocation =
        filterLocation === "all" || p.location.includes(filterLocation);

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
                <Globe size={18} className="text-blue-400" />
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest">
                    Panel Penjual
                  </h2>
                  <p className="text-[10px] text-white/40 font-bold">
                    Kelola Iklan & Properti Anda
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* tools tetap sama */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {filteredListings.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-slate-500 font-bold">Tidak ada iklan</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredListings.map((property) => (
                    <motion.div
                      key={property.id}
                      className="p-3 border rounded-sm flex gap-3"
                    >
                      <img
                        src={property.image}
                        className="w-20 h-20 object-cover rounded-sm"
                      />

                      <div className="flex-1">
                        <h3 className="font-bold text-sm">{property.title}</h3>
                        <p className="text-xs text-slate-500">
                          {property.location}
                        </p>

                        <div className="flex justify-between mt-2">
                          <p className="font-bold text-xs">
                            Rp {property.price.toLocaleString("id-ID")}
                          </p>

                          <button
                            onClick={() => onDelete(property.id)}
                            className="text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
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
