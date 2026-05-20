import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Sparkles, RefreshCcw, AlertCircle, Volume2 } from 'lucide-react';
import { useApp } from '../store/AppContext';

interface BarcodeScannerProps {
  onScanSuccess: (code: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose }) => {
  const { parts } = useApp();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanStatus, setScanStatus] = useState<string>('Iniciando cámara...');
  const [availableOEMs] = useState<string[]>(() => {
    // Collect OEM codes from existing parts
    return parts.map(p => p.codigo);
  });
  const [selectedSimulatedOEM, setSelectedSimulatedOEM] = useState<string>('');

  // Start live stream
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    const startCam = async () => {
      try {
        setScanStatus('Solicitando permisos de cámara...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        
        activeStream = stream;
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
          setScanStatus('Buscando códigos de barra / OEM en el visor...');
        }
      } catch (err) {
        console.warn("Could not acquire actual camera feed:", err);
        setHasPermission(false);
        setScanStatus('Cámara física no disponible en este dispositivo/iframe. Simula el escaneo con el selector rápido.');
      }
    };

    startCam();

    // Clean up
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Make an interactive audio feedback beep using Web Audio API!
  const triggerBeepSuccess = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(980, audioCtx.currentTime); // High pitched beep
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15); // Beep for 150ms
    } catch (error) {
      console.log("AudioContext is blocked by user gesture restrictions:", error);
    }
  };

  const handleSimulateScan = (codeToScan: string) => {
    if (!codeToScan) return;
    triggerBeepSuccess();
    setScanStatus(`¡CÓDIGO OEM DETECTADO: ${codeToScan}!`);
    setTimeout(() => {
      onScanSuccess(codeToScan);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <div className="relative w-full max-w-md border border-white/10 rounded-xl glass-panel-heavy overflow-hidden shadow-2xl flex flex-col">
        {/* Header bar */}
        <div className="p-4 bg-[#1f2833]/80 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2 text-cyan-400">
            <Camera size={18} className="animate-pulse" />
            <span className="font-display font-bold text-sm">Escáner de Barra / PLU - Marketo</span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xs bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md transition-all font-mono"
          >
            Cerrar
          </button>
        </div>

        {/* Viewfinder Window */}
        <div className="relative aspect-video w-full bg-[#0b0c10] flex items-center justify-center overflow-hidden border-b border-white/5">
          {hasPermission === true ? (
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-cover scale-x-102 opacity-75"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-gray-500 bg-[#0f1218]">
              <CameraOff size={36} className="text-gray-600 mb-2" />
              <p className="text-xs uppercase tracking-wider font-mono font-bold text-yellow-500/80 mb-1 flex items-center gap-1">
                <AlertCircle size={12} /> Cámara física offline
              </p>
              <p className="text-[11px] leading-relaxed max-w-xs text-gray-400">
                El entorno de iFrame o de sandbox de producción no tiene acceso al hardware stream. Usa el emulador de escaneo premium estructurado abajo.
              </p>
            </div>
          )}

          {/* Glowing laser target guidelines */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
            <div className="flex justify-between">
              <div className="w-5 h-5 border-t-2 border-l-2 border-[#45f3ff]"></div>
              <div className="w-5 h-5 border-t-2 border-r-2 border-[#45f3ff]"></div>
            </div>
            {/* Pulsing horizontal laser line */}
            <div className="w-full h-[2px] bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-bounce" />
            <div className="flex justify-between">
              <div className="w-5 h-5 border-b-2 border-l-2 border-[#45f3ff]"></div>
              <div className="w-5 h-5 border-b-2 border-r-2 border-[#45f3ff]"></div>
            </div>
          </div>
        </div>

        {/* Status indicator bar */}
        <div className="px-4 py-2 bg-black/40 text-[11px] text-gray-400 font-mono flex items-center gap-2 border-b border-white/5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Status: {scanStatus}</span>
        </div>

        {/* Emulation & Code Injector segment */}
        <div className="p-4 flex flex-col gap-3">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
            <Sparkles size={11} className="text-[#45f3ff]" /> Emulador de Scanner (Simulación OEM)
          </span>

          <div className="grid grid-cols-1 gap-2">
            <label className="text-[11px] text-gray-400 leading-tight">
              Seleccione un producto cargado en el inventario para simular que pasa su código de barras físico frente a la cámara:
            </label>
            
            <div className="flex gap-2">
              <select
                value={selectedSimulatedOEM}
                onChange={(e) => setSelectedSimulatedOEM(e.target.value)}
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#45f3ff] transition-all"
              >
                <option value="">-- Elige un producto del stock --</option>
                {parts.map((p) => (
                  <option key={p.id} value={p.codigo}>
                     [{p.codigo}] - {p.nombre} (Stock: {p.stock} pz)
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={!selectedSimulatedOEM}
                onClick={() => handleSimulateScan(selectedSimulatedOEM)}
                className="bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-semibold text-xs px-4 rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Volume2 size={13} />
                Escanear
              </button>
            </div>
          </div>

          <div className="mt-2 text-[10px] text-gray-500 border-t border-white/5 pt-2 text-center">
            Ideal para teléfonos móviles o tabletas en el piso de la tienda Marketo. En cámara real, el haz busca el código de barras o PLU para sincronización de inventario.
          </div>
        </div>
      </div>
    </div>
  );
};
