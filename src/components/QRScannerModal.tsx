import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, AlertCircle, Sparkles, CheckCircle2, RefreshCw, Upload } from 'lucide-react';
import jsQR from 'jsqr';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
  title?: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Asset QR / Barcode',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setIsScanning(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    setScannedResult(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser or environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        setIsScanning(true);
        scanFrame();
      }
    } catch (err: any) {
      console.warn('Camera initialization error:', err);
      let errorMsg = 'Could not access the camera. Please ensure camera permissions are enabled.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission was denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera device found on this system.';
      }
      setCameraError(errorMsg);
      setCameraActive(false);
    }
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data && code.data.trim().length > 0) {
      handleSuccessfulScan(code.data.trim());
      return;
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const handleSuccessfulScan = (result: string) => {
    let assetTag = result;
    try {
      if (result.startsWith('{') && result.endsWith('}')) {
        const parsed = JSON.parse(result);
        assetTag = parsed.assetTag || parsed.tag || parsed.id || result;
      }
    } catch {
      // Keep plain text
    }

    setScannedResult(assetTag);
    setIsScanning(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Vibrate on mobile if available
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    setTimeout(() => {
      onScan(assetTag);
      onClose();
    }, 900);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          handleSuccessfulScan(code.data.trim());
        } else {
          setCameraError('No valid QR code or Barcode detected in the uploaded image.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Stop camera when modal closes
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="qr-scanner-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A1626]/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="qr-scanner-modal-content"
        className="bg-white rounded-3xl border border-[#E9EBEF] shadow-2xl max-w-md w-full overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E9EBEF] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1B3A5C]/10 flex items-center justify-center text-[#1B3A5C]">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#1B3A5C] tracking-tight">{title}</h3>
              <p className="text-[11px] text-[#6B7280]">Real-time physical audit scan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-[#F5F6F8] flex items-center justify-center text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Canvas Area */}
        <div className="relative bg-[#0F172A] aspect-4/3 flex items-center justify-center overflow-hidden">
          {/* Offscreen Canvas for jsQR */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Live Video Feed */}
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            muted
          />

          {/* Scanning HUD Overlay */}
          {cameraActive && !scannedResult && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {/* Outer darkened mask border */}
              <div className="w-56 h-56 border-2 border-white/40 rounded-2xl relative flex items-center justify-center shadow-[0_0_0_9999px_rgba(15,23,42,0.55)]">
                {/* Target Corners */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#2F6650] rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#2F6650] rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#2F6650] rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#2F6650] rounded-br-lg" />

                {/* Animated Laser Scanning Line */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#2F6650] to-transparent animate-pulse shadow-[0_0_8px_#2F6650]" />
              </div>

              <div className="absolute bottom-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C9A227]" />
                <span>Align QR / Barcode within frame</span>
              </div>
            </div>
          )}

          {/* Scanned Success Overlay */}
          {scannedResult && (
            <div className="absolute inset-0 bg-[#2F6650]/95 flex flex-col items-center justify-center p-6 text-white text-center animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-base font-black tracking-tight mb-1">Asset Identified!</h4>
              <p className="text-xs bg-white/20 px-3 py-1.5 rounded-lg font-mono font-bold tracking-wider mt-1">
                {scannedResult}
              </p>
              <p className="text-[11px] text-white/80 mt-2">Loading asset registry record...</p>
            </div>
          )}

          {/* Error / Fallback State */}
          {cameraError && (
            <div className="p-6 text-center text-white flex flex-col items-center justify-center max-w-xs">
              <AlertCircle className="w-10 h-10 text-[#C9A227] mb-3" />
              <h4 className="text-sm font-bold text-white mb-1">Camera Access Required</h4>
              <p className="text-xs text-white/70 leading-relaxed mb-4">{cameraError}</p>
              <div className="flex gap-2">
                <button
                  onClick={startCamera}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Camera</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls & Manual Asset Tag Selector */}
        <div className="p-4 bg-[#F8F9FA] border-t border-[#E9EBEF] flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 px-3 bg-white border border-[#E9EBEF] hover:bg-[#F5F6F8] rounded-xl text-xs font-bold text-[#1A1A1A] flex items-center justify-center gap-2 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-[#1B3A5C]" />
              <span>Scan QR from Image</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-white border border-[#E9EBEF] hover:bg-[#F5F6F8] rounded-xl text-xs font-bold text-[#6B7280] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
