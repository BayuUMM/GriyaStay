import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Camera, MapPin, Plus, CheckCircle2, Compass } from "lucide-react";
import { Property } from "../types";
import { useUser } from "../context/UserContext";

interface SellPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (property: Property) => void;
}

export default function SellPropertyModal({
  isOpen,
  onClose,
  onAdd,
}: SellPropertyModalProps) {
  const { user, loading } = useUser();

  const [formData, setFormData] = useState({
    title: "",
    type: "house" as "house" | "hotel" | "apartment",
    price: "",
    city: "",
    address: "",
    description: "",
    image: "",
    vrImage: "",
    features: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 🔥 FIX 1: loading state
    if (loading) return;

    // 🔥 FIX 2: wajib login
    if (!user) {
      alert("Kamu harus login dulu untuk jual properti");
      return;
    }

    const newProperty: Property = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: formData.title,
      type: formData.type,
      price: Number(formData.price),
      location: formData.city,
      description: formData.description,
      image:
        formData.image ||
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      vrImage: formData.vrImage,
      rating: 5.0,
      reviews: 0,
      features: formData.features.split(",").map((f) => f.trim()),
      createdAt: new Date().toISOString(),

      // 🔥 FIX 3: aman karena sudah pasti login
      ownerId: user.email,
    };

    onAdd(newProperty);

    setFormData({
      title: "",
      type: "house",
      price: "",
      city: "",
      address: "",
      description: "",
      image: "",
      vrImage: "",
      features: "",
    });

    onClose();
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
                <Plus
                  size={20}
                  className="bg-slate-800 text-white rounded-full p-0.5"
                />{" "}
                Jual Properti Anda
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 overflow-y-auto space-y-4 text-slate-700"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  required
                  placeholder="Nama Properti"
                  className="w-full p-2.5 border rounded-sm"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />

                <select
                  className="w-full p-2.5 border rounded-sm"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as any })
                  }
                >
                  <option value="house">Rumah</option>
                  <option value="hotel">Hotel</option>
                  <option value="apartment">Apartemen</option>
                </select>
              </div>

              <input
                required
                type="number"
                placeholder="Harga"
                className="w-full p-2.5 border rounded-sm"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />

              <input
                required
                placeholder="Kota"
                className="w-full p-2.5 border rounded-sm"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
              />

              <textarea
                required
                placeholder="Deskripsi"
                className="w-full p-2.5 border rounded-sm"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />

              <input
                type="url"
                placeholder="URL Gambar"
                className="w-full p-2.5 border rounded-sm"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
              />

              <input
                type="url"
                placeholder="URL VR (opsional)"
                className="w-full p-2.5 border rounded-sm"
                value={formData.vrImage}
                onChange={(e) =>
                  setFormData({ ...formData, vrImage: e.target.value })
                }
              />

              <input
                placeholder="Fitur (pisahkan koma)"
                className="w-full p-2.5 border rounded-sm"
                value={formData.features}
                onChange={(e) =>
                  setFormData({ ...formData, features: e.target.value })
                }
              />

              <button
                type="submit"
                className="w-full bg-slate-800 text-white py-3 rounded-sm font-bold"
              >
                Daftarkan Properti
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
