'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import { Loader } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from '@/lib/hooks/useToast';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  open,
  onClose,
  onScan,
}) => {
  const [scanning, setScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [errorMessage, setErrorMessage] = useState('');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');

  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (open) {
      initializeCameraSystem();
    } else {
      stopScanning();
    }
    return () => {
      stopScanning();
    };
  }, [open]);

  const initializeCameraSystem = async () => {
    try {
      console.log('[Scanner] 1. Initializing sequence started');

      // Constraint 3: Check HTTPS requirement before accessing camera
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        throw new Error('MediaDevicesNotFound');
      }

      // Constraint 4: Check if devices list API is accessible before checking explicitly
      if (!navigator.mediaDevices.enumerateDevices) {
        throw new Error('EnumerateDevicesNotFound');
      }

      // Pre-check devices mapping
      let devices = await navigator.mediaDevices.enumerateDevices();
      let videoDevices = devices.filter(d => d.kind === 'videoinput');
      console.log('[Scanner] 2. Raw accessible video inputs before permission:', videoDevices);

      // Constraint 1: Explicitly request permission using browser APIs
      setCameraPermission('prompt');
      let stream: MediaStream | null = null;
      try {
        console.log('[Scanner] 3. Starting explicit getUserMedia call...');
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log('[Scanner] 4. getUserMedia granted stream successfully.');
      } catch (err: any) {
        // Constraint 2: Add proper error handling and log explicit OS errors
        console.error('[Scanner] getUserMedia Error:', err.name, err.message);

        let msg = 'Unknown camera error occurred in the browser';
        if (err.name === 'NotAllowedError') {
          msg = 'Camera permission explicitly denied or blocked by browser settings.';
        } else if (err.name === 'NotFoundError') {
          msg = 'No physical or virtual camera hardware found by the OS.';
        } else if (err.name === 'NotReadableError') {
          msg = 'Hardware error: Camera is permanently locked by another app (e.g. Zoom, OBS).';
        } else if (err.name === 'OverconstrainedError') {
          msg = 'Requested camera resolution constraints cannot be met by hardware.';
        } else {
          msg = `Raw Exception - ${err.name}: ${err.message}`;
        }

        setErrorMessage(msg);
        setCameraPermission('denied'); // Constraint 6
        return;
      }

      // Constraint 6: If granted, proceed to scan
      setCameraPermission('granted');

      // Constraint 4/5: Enumerate devices AFTER permission is granted to get pure strings/labels
      devices = await navigator.mediaDevices.enumerateDevices();
      videoDevices = devices.filter(d => d.kind === 'videoinput');
      console.log('[Scanner] 5. Full video inputs payload after permission:', videoDevices);

      // Constraint 8: DO NOT assume no camera exists unless enumerateDevices returns empty list
      if (videoDevices.length === 0) {
        const errorMsg = 'enumerateDevices() explicitly executed successfully but returned 0 items. Real hardware is entirely missing.';
        console.error(errorMsg);
        setErrorMessage(errorMsg);
        setCameraPermission('denied');
        if (stream) stream.getTracks().forEach(t => t.stop());
        return;
      }

      setCameras(videoDevices);

      // Map ideal camera (fallback logic)
      const backCamera = videoDevices.find(d => d.label.toLowerCase().includes('back'));
      const activeCameraId = backCamera?.deviceId || videoDevices[0].deviceId;
      setSelectedCamera(activeCameraId);

      // Kill the temporary confirmation stream so html5-qrcode can explicitly acquire the camera stream later
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }

      // Boot up the native UI overlay system
      setTimeout(() => {
        startScanner(activeCameraId);
      }, 100);

    } catch (err: any) {
      console.error('[Scanner] Internal framework fault:', err);
      if (err.message === 'MediaDevicesNotFound') {
        setErrorMessage('Severe System Policy: navigator.mediaDevices null. Strict HTTPS / localhost Required.');
      } else {
        setErrorMessage(err.message || 'Fatal initialization failed.');
      }
      setCameraPermission('denied');
    }
  };

  const startScanner = async (cameraId: string) => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode('qr-reader');
    }

    try {
      setScanning(true);
      await scannerRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          toast.success('Scanned!', decodedText);
          onScan(decodedText);
          handleClose();
        },
        (errorMessage) => { /* ignore minor read ticks */ }
      );
      console.log('[Scanner] 6. Html5Qrcode stream successfully running. Source:', cameraId);
    } catch (err: any) {
      console.error('[Scanner] Html5Qrcode streaming exception:', err);
      toast.error('Library Mount Failed', 'System locked preventing hardware capture.');
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && scanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        setScanning(false);
      } catch (err) {
        console.error('[Scanner] Warning: Failed to unmount camera gracefully:', err);
      }
    }
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} size="lg">
      <DialogHeader>
        <DialogTitle>Warehouse Barcode Capture System</DialogTitle>
      </DialogHeader>

      <DialogContent>
        <div className="space-y-4">

          {/* Constraint 6: Proper state mapping to UI */}
          {cameraPermission === 'denied' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 dark:text-red-200 text-sm mb-1 uppercase tracking-wide">
                Hardware Access Policy Blocked
              </h4>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {errorMessage}
              </p>
            </div>
          )}

          {cameraPermission === 'granted' && cameras.length > 1 && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">
                Active Source
              </label>
              <select
                value={selectedCamera}
                onChange={async (e) => {
                  const newCam = e.target.value;
                  setSelectedCamera(newCam);
                  if (scanning) {
                    await stopScanning();
                    setTimeout(() => startScanner(newCam), 100);
                  }
                }}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-800 dark:text-gray-100 ring-0 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
              >
                {cameras.map(cam => (
                  <option key={cam.deviceId || cam.label} value={cam.deviceId}>
                    {cam.label || `Unknown Camera Source ${cam.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg shadow-inner overflow-hidden">
            <div
              id="qr-reader"
              className="w-full bg-black/95 flex items-center justify-center transition-all"
              style={{ minHeight: '300px' }}
            />

            {cameraPermission === 'prompt' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/40 backdrop-blur-sm z-10">
                <Loader className="w-8 h-8 text-blue-500 animate-spin drop-shadow-md" />
                <p className="mt-4 text-sm font-semibold text-white drop-shadow-md">Engaging Primary Systems...</p>
                <p className="mt-1 text-xs text-white/80">Please check your permissions popup.</p>
              </div>
            )}

            {cameraPermission === 'granted' && !scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm z-10">
                <Button variant="primary" onClick={() => startScanner(selectedCamera)}>
                  Resume Capture Stream
                </Button>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              Fallback Pipeline
            </p>
            <div className="flex gap-2">
              <input
                id="manual-code"
                type="text"
                placeholder="Submit hardware token ID..."
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 font-mono text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    onScan(e.currentTarget.value);
                    handleClose();
                  }
                }}
              />
              <Button
                variant="primary"
                className="font-medium px-6 shadow-sm"
                onClick={() => {
                  const val = (document.getElementById('manual-code') as HTMLInputElement)?.value;
                  if (val) {
                    onScan(val);
                    handleClose();
                  }
                }}
              >Input Override</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
