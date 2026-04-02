import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    // 1. Configuramos el escáner para usar el motor nativo de Android y buscar formatos 1D
    const html5QrCode = new Html5Qrcode("reader", {
      verbose: false,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E
      ],
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true // ¡VITAL! Usa la API nativa de Android para escanear rapidísimo
      }
    });
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        const hasCamera = await Html5Qrcode.getCameras();
        if (hasCamera && hasCamera.length > 0) {
          if (isMounted) setHasPermission(true);
          
          // 2. Optimizamos la captura de video
          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 30, // Aumentamos a 30 frames por segundo para detección casi instantánea
              qrbox: { width: 320, height: 150 }, // Caja más ancha para códigos de barras largos
              disableFlip: false,
            },
            (decodedText) => {
              if (isMounted) {
                html5QrCode.stop().then(() => {
                  onScan(decodedText);
                }).catch(console.error);
              }
            },
            (errorMessage) => {
              // Ignore scan errors as they happen continuously when no barcode is found
            }
          );
        } else {
          if (isMounted) {
            setHasPermission(false);
            setError('No se encontraron cámaras en el dispositivo.');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setHasPermission(false);
          setError('Permiso de cámara denegado o error al iniciar la cámara.');
          console.error("Error starting scanner:", err);
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md">
      <div className="flex justify-between items-center p-4 bg-black/50 border-b border-white/10">
        <h2 className="text-white font-bold flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-400" />
          Escanear Código
        </h2>
        <button onClick={onClose} className="p-2 text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <X size={24} />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <div className="w-full max-w-md relative">
          {/* Scanner Container */}
          <div 
            id="reader" 
            className="w-full bg-black rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl"
            style={{ minHeight: '300px' }}
          ></div>
          
          {/* Overlay Guidelines (only show if permission granted and no error) */}
          {hasPermission && !error && (
            <div className="absolute inset-0 pointer-events-none border-2 border-blue-500/50 rounded-2xl z-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-32 border-2 border-blue-400 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                {/* Scanning animation line */}
                <div className="w-full h-0.5 bg-blue-400 absolute top-0 left-0 animate-[scan_2s_ease-in-out_infinite]" />
              </div>
            </div>
          )}
        </div>

        <p className="text-white text-center mt-8 text-sm opacity-70 max-w-xs">
          Apunta la cámara al código de barras. El escaneo se realizará automáticamente.
        </p>
      </div>
      
      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        #reader video {
          object-fit: cover !important;
          border-radius: 1rem !important;
        }
      `}</style>
    </div>
  );
};
