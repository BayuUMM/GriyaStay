import supabase from "./supabase";
import React, { useState, useMemo, useEffect } from "react";
import Navbar from "./components/Navbar";
import CategoryTabs from "./components/CategoryTabs";
import PropertyCard from "./components/PropertyCard";
import AuthModal from "./components/AuthModal";
import SellPropertyModal from "./components/SellPropertyModal";
import MyListingsModal from "./components/MyListingsModal";
import { VRTourModal } from "./components/VRTourModal";
import { ChatAssistant } from "./components/ChatAssistant";
import { mockProperties } from "./data/mockData";
import { Property, CartItem, FilterTab } from "./types";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  Star,
  Shield,
  CreditCard,
  Truck,
  MessageCircle,
  Search,
  CheckCircle2,
  Info,
  Percent,
  ShoppingCart,
  Trash2,
  ArrowRight,
  Plus,
  ArrowUp,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useUser } from "./context/UserContext";

export default function App() {
  const { user } = useUser();

  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<CartItem | null>(null);
  const [bookingDuration, setBookingDuration] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<
    "griyastay" | "bank" | "ewallet" | "qris"
  >("griyastay");

  const [toasts, setToasts] = useState<any[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const safeUserEmail = user?.email ?? "";

  // ================= SAFE SUPABASE =================
  useEffect(() => {
    const testDB = async () => {
      try {
        await supabase.from("users").select("*").limit(1);
      } catch (e) {
        console.log("Supabase safe error");
      }
    };
    testDB();
  }, []);

  // ================= SAFE OWNER PATCH =================
  useEffect(() => {
    if (!user) return;

    setProperties((prev) =>
      prev.map((p) => (p.ownerId ? p : { ...p, ownerId: safeUserEmail })),
    );
  }, [user]);

  // ================= FILTER SAFE =================
  const filteredProperties = useMemo(() => {
    if (!Array.isArray(properties)) return [];

    return properties
      .filter((p) => {
        if (!p) return false;

        return (
          (p.title ?? "").toLowerCase().includes(searchQuery.toLowerCase()) &&
          (selectedLocation === "all" ||
            (p.location ?? "").includes(selectedLocation))
        );
      })
      .sort((a, b) => {
        return Number(b?.createdAt ?? 0) - Number(a?.createdAt ?? 0);
      });
  }, [properties, searchQuery, selectedLocation]);

  // ================= TOAST =================
  const addToast = (message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // ================= AUTH =================
  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  // ================= CART SAFE =================
  const addToCart = (property: Property, duration: number) => {
    if (!user) return openAuth("login");

    setCart((prev) => {
      const existing = prev.find((i) => i.id === property.id);

      if (existing) {
        return prev.map((i) =>
          i.id === property.id
            ? {
                ...i,
                duration: i.duration + duration,
                quantity: (i.quantity ?? 1) + 1,
              }
            : i,
        );
      }

      const newItem: CartItem = {
        ...property,
        duration,
        quantity: 1,
      };

      return [...prev, newItem];
    });
  };

  // ================= PRICE SAFE =================
  const formatPrice = (price: number = 0) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <div className="min-h-screen bg-white">
      {/* NAVBAR FIXED */}
      <Navbar
        onSearch={setSearchQuery}
        favoriteCount={favorites.length}
        cartCount={cart.length}
        onOpenAuth={openAuth}
        onOpenCart={() => setIsCartOpen(true)}
        onShowMyListings={() => {
          if (!user) openAuth("login");
        }}
      />

      {/* TOAST */}
      <div className="fixed top-4 right-4 z-[999]">
        {toasts.map((t) => (
          <div key={t.id} className="bg-black text-white p-2 mb-2 rounded">
            {t.message}
          </div>
        ))}
      </div>

      {/* LIST */}
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {(filteredProperties ?? []).map((p) => (
          <div key={p?.id ?? Math.random()}>
            <PropertyCard
              property={{
                ...p,
                features: p?.features ?? [],
                amenities: p?.amenities ?? [],
              }}
              isFavorite={favorites.includes(p?.id ?? "")}
              onClick={() => setSelectedProperty(p)}
              onFavoriteToggle={() => {}}
              onOpenVR={() => {}}
              onShare={() => addToast("copied")}
              isOwner={!!user?.email && p?.ownerId === user?.email}
              onDelete={() => {}}
            />
          </div>
        ))}
      </div>

      {/* EMPTY */}
      {filteredProperties.length === 0 && (
        <div className="text-center p-10 text-gray-400">
          Properti tidak ditemukan
        </div>
      )}

      {/* MODAL SAFE */}
      <AnimatePresence>
        {selectedProperty && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
            <div className="bg-white p-4 rounded">
              <button onClick={() => setSelectedProperty(null)}>
                <X />
              </button>

              <h2>{selectedProperty?.title}</h2>

              <p>
                Total:{" "}
                {formatPrice(
                  Number(selectedProperty?.price ?? 0) *
                    Number(bookingDuration ?? 1),
                )}
              </p>

              <button
                onClick={() => addToCart(selectedProperty, bookingDuration)}
                className="bg-black text-white px-4 py-2"
              >
                Add To Cart
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      <ChatAssistant properties={properties ?? []} />
    </div>
  );
}
