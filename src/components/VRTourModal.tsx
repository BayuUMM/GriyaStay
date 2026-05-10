
import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Maximize2, ZoomIn, ZoomOut, Phone, Compass, MousePointer2 } from 'lucide-react';
import * as THREE from 'three';
import { Property } from '../types';

interface VRTourModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VRTourModal = ({ property, isOpen, onClose }: VRTourModalProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quality, setQuality] = useState<'performance' | 'high'>('performance');
  
  // Use a highly optimized equirectangular panorama image for maximum performance
  const getPanoramaUrl = (url: string | null | undefined, mode: 'performance' | 'high') => {
    const base = url || "https://images.unsplash.com/photo-1557597774-9d273605dfa9";
    const width = mode === 'high' ? 2400 : 1024;
    const quality = mode === 'high' ? 80 : 50;
    
    // Replace or append Unsplash params
    if (base.includes('unsplash.com')) {
      return `${base.split('?')[0]}?auto=format&fit=crop&w=${width}&q=${quality}`;
    }
    return base;
  };

  useEffect(() => {
    if (!isOpen || !mountRef.current || !property) return;

    setIsLoading(true);

    // SCENE SETUP
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // RENDERER SETTINGS BASED ON QUALITY
    const renderer = new THREE.WebGLRenderer({ 
      antialias: quality === 'high', 
      powerPreference: "high-performance" 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(quality === 'high' ? Math.min(window.devicePixelRatio, 2) : 1);
    mountRef.current.appendChild(renderer.domElement);

    // CREATE SPHERE GEOMETRY BASED ON QUALITY
    const segments = quality === 'high' ? 60 : 24;
    const rings = quality === 'high' ? 40 : 16;
    const geometry = new THREE.SphereGeometry(500, segments, rings);
    // Invert the geometry on the x-axis so that all of the faces point inward
    geometry.scale(-1, 1, 1);

    const loader = new THREE.TextureLoader();
    const currentPanoramaUrl = getPanoramaUrl(property.vrImage, quality);
    
    loader.load(currentPanoramaUrl, (texture) => {
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);
      setIsLoading(false);
    }, undefined, (err) => {
      console.error("Texture Load Error:", err);
      setIsLoading(false);
    });

    camera.position.set(0, 0, 0.1);

    // INTERACTION LOGIC (Looking around)
    let isUserInteracting = false;
    let onPointerDownPointerX = 0;
    let onPointerDownPointerY = 0;
    let onPointerDownLon = 0;
    let onPointerDownLat = 0;
    let lon = 0;
    let lat = 0;
    let phi = 0;
    let theta = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (event.isPrimary === false) return;
      isUserInteracting = true;
      onPointerDownPointerX = event.clientX;
      onPointerDownPointerY = event.clientY;
      onPointerDownLon = lon;
      onPointerDownLat = lat;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.isPrimary === false) return;
      if (isUserInteracting === true) {
        lon = (onPointerDownPointerX - event.clientX) * 0.1 + onPointerDownLon;
        lat = (event.clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
      }
    };

    const onPointerUp = () => {
      isUserInteracting = false;
    };

    const onDocumentMouseWheel = (event: WheelEvent) => {
      const fov = camera.fov + event.deltaY * 0.05;
      camera.fov = THREE.MathUtils.clamp(fov, 30, 90);
      camera.updateProjectionMatrix();
    };

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', onWindowResize);
    mountRef.current.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    mountRef.current.addEventListener('wheel', onDocumentMouseWheel);

    // ANIMATION LOOP
    const animate = () => {
      if (!isOpen) return;
      requestAnimationFrame(animate);

      lat = Math.max(-85, Math.min(85, lat));
      phi = THREE.MathUtils.degToRad(90 - lat);
      theta = THREE.MathUtils.degToRad(lon);

      const x = 500 * Math.sin(phi) * Math.cos(theta);
      const y = 500 * Math.cos(phi);
      const z = 500 * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(x, y, z);
      renderer.render(scene, camera);
    };

    animate();

    // CLEANUP
    return () => {
      window.removeEventListener('resize', onWindowResize);
      if (mountRef.current) {
        mountRef.current.removeEventListener('pointerdown', onPointerDown);
        mountRef.current.removeEventListener('wheel', onDocumentMouseWheel);
      }
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      geometry.dispose();
      scene.clear();
      renderer.dispose();
    };
  }, [isOpen, property, quality]);

  if (!property) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black flex flex-col"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            <div className="pointer-events-auto">
              <h2 className="text-white font-black text-xl md:text-3xl tracking-tighter uppercase drop-shadow-lg">{property.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                <p className="text-white/80 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] drop-shadow-md">Professional 360° VR Tour</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="pointer-events-auto w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-md border border-white/10 shadow-2xl"
            >
              <X size={24} />
            </button>
          </div>

          {/* VR Mounting Point */}
          <div 
            ref={mountRef}
            className="flex-1 bg-slate-950 cursor-move relative touch-none"
          >
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-30 overflow-hidden">
                {/* Holographic Sphere Animation */}
                <div className="relative w-48 h-48 flex items-center justify-center">
                  {/* Rotating Outer Rings */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border border-white/5 rounded-full"
                  />
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-4 border border-white/10 rounded-full border-t-rose-500/50"
                  />
                  
                  {/* Pulsing Core */}
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-12 h-12 bg-white/10 rounded-full blur-xl"
                  />
                  
                  {/* Scanning Line */}
                  <motion.div 
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/50 to-transparent z-10"
                  />

                  {/* Icon or Logo in center */}
                  <Compass className="text-white/20 absolute" size={32} />
                </div>

                <div className="mt-8 flex flex-col items-center gap-2">
                  <p className="text-white text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Initializing VR Space</p>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="w-1 h-1 bg-white rounded-full"
                      />
                    ))}
                  </div>
                </div>
                
                {/* Background ambient glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/5 blur-[120px] rounded-full pointer-events-none" />
              </div>
            )}

            {/* Visual Guides */}
            {!isLoading && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-24 h-24 border border-white/5 rounded-full flex items-center justify-center">
                  <div className="w-12 h-12 border border-white/10 rounded-full animate-ping opacity-20" />
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-6 md:p-8 bg-black border-t border-white/5 flex flex-wrap justify-between items-center gap-6 z-20">
            <div className="flex items-center gap-4">
              <div className="bg-slate-900/50 p-4 rounded-sm border border-white/10 flex items-center gap-4">
                <MousePointer2 size={18} className="text-white/40" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] text-white/40 font-bold uppercase tracking-widest leading-none">Kontrol</span>
                  <span className="text-[10px] font-bold text-white tracking-widest leading-none uppercase">Klik & Geser</span>
                </div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-sm border border-white/10 flex items-center gap-4">
                <Compass size={18} className="text-white/40" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] text-white/40 font-bold uppercase tracking-widest leading-none">Sensor</span>
                  <span className="text-[10px] font-bold text-white tracking-widest leading-none uppercase">360° Spherical</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="hidden xl:flex items-center gap-4 px-6 border-r border-white/10 h-10 mr-4">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Kualitas Render</span>
                  <button 
                    onClick={() => setQuality(quality === 'performance' ? 'high' : 'performance')}
                    className={`text-[9px] font-black px-3 py-1 rounded-sm uppercase transition-all flex items-center gap-2 ${
                      quality === 'high' 
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${quality === 'high' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                    {quality === 'high' ? 'High Quality' : 'Performance Mode'}
                  </button>
               </div>

               <button className="flex items-center gap-3 bg-white text-slate-950 px-8 py-4 rounded-sm font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-100 transition-all hover:scale-105 active:scale-95">
                 <Phone size={16} />
                 Booking Sekarang
               </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

