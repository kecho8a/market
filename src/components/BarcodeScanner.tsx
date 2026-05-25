import React, { useState } from 'react';
import { Sparkles, Volume2, X, Search } from 'lucide-react';
import { useApp } from '../store/AppContext';

interface BarcodeScannerProps {
  onScanSuccess: (code: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose }) => {
  const { parts } = useApp();
  const [selectedSimulatedSKU, setSelectedSimulatedSKU] = useState<string>('');
  const [scanStatus, setScanStatus] = useState<string>('Listo para búsqueda rápida...');

  const handleSimulateScan = (codeToScan: string) => {
    if (!codeToScan) return;
    setScanStatus(`PRODUCTO SELECCIONADO: ${codeToScan}`);
    setTimeout(() => {
      onScanSuccess(codeToScan);
    }, 450);
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <div className="relative w-full max-w-md border border-white/10 rounded-2xl bg-[#0b0c10] overflow-hidden shadow-2xl flex flex-col">
        {/* Header bar */}
        <div className="p-5 bg-[#1f2833]/80 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2 text-indigo-400">
            <Search size={18} />
            <span className="font-display font-bold text-sm">Buscador de Inventario</span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xs bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md transition-all font-mono"
          >
            Cerrar
          </button>
        </div>

        {/* Status indicator bar */}
        <div className="px-4 py-2 bg-black/40 text-[11px] text-gray-400 font-mono flex items-center gap-2 border-b border-white/5">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span>Status: {scanStatus}</span>
        </div>

        {/* Emulation & Code Injector segment */}
        <div className="p-4 flex flex-col gap-3">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
            <Sparkles size={11} className="text-[#45f3ff]" /> Emulador de Scanner (Simulación de Código)
          </span>

          <div className="grid grid-cols-1 gap-2">
            <label className="text-[11px] text-gray-400 leading-tight">
              Seleccione un producto cargado en el inventario para simular que pasa su código de barras físico frente a la cámara:
            </label>
            
            <div className="flex gap-2">
              <select
                value={selectedSimulatedSKU}
                onChange={(e) => setSelectedSimulatedSKU(e.target.value)}
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#45f3ff] transition-all"
              >
                <option value="">-- Elige un producto del stock --</option>
                {parts.map((p) => (
                  <option key={p.id} value={p.codigo}>
                     [{p.codigo}] - {p.nombre} (Stock: {p.stock} unid)
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={!selectedSimulatedSKU}
                onClick={() => handleSimulateScan(selectedSimulatedSKU)}
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
