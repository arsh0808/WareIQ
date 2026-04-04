'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import { Camera, X, Loader } from 'lucide-react';
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
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');

  useEffect(() => {
    if (open) {
      checkCameraPermission();
      getCameras();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [open]);

  const checkCameraPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setCameraPermission(result.state as any);

      result.addEventListener('change', () => {
        setCameraPermission(result.state as any);
      });
    } catch (error) {
      console.error('Permission check error:', error);
    }
  };

  const getCameras = async () => {
    try {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          toast.error('Secure Connection Required', 'Cameras require HTTPS or localhost. If you are using an IP address (like 192.168.x.x), you must use HTTPS.');
          setCameraPermission('denied');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setCameraPermission('granted');
      } catch (permissionError: any) {
        console.warn('Manual getUserMedia failed', permissionError);

        if (permissionError.name === 'NotAllowedError') {
          toast.error('Permission Blocked', 'The browser settings have explicitly set camera to Blocked.');
        } else if (permissionError.name === 'NotFoundError') {
          toast.error('No Camera Found', 'The OS reports exactly 0 cameras connected or active.');
        } else if (permissionError.name === 'NotReadableError') {
          toast.error('Camera In Use', 'Another app (Zoom, Teams, etc) is already holding the camera lock!');
        } else {
          toast.error('Hardware Error', `${permissionError.name}: ${permissionError.message}`);
        }

        setCameraPermission('denied');
        return; // Don't proceed to getCameras if getting base permission fundamentally crashes
      }

      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);
      if (devices.length > 0) {
        const backCamera = devices.find(d => d.label.toLowerCase().includes('back'));
        const cameraToUse = backCamera?.id || devices[0].id;
        setSelectedCamera(cameraToUse);

        // Auto-start scanning once camera is selected
        setTimeout(() => {
          startScanning(cameraToUse);
        }, 100);
      }
    } catch (error) {
      console.error('Error getting cameras:', error);
      toast.error('Camera access failed', 'Please allow camera permissions');
    }
  };

  const startScanning = async (cameraId?: string) => {
    const targetCamera = cameraId || selectedCamera;
    if (!targetCamera) {
      toast.error('No camera selected', 'Please select a camera');
      return;
    }

    try {
      setScanning(true);

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader');
      }

      await scannerRef.current.start(
        targetCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {

          toast.success('Code scanned!', decodedText);
          onScan(decodedText);
          stopScanning();
          onClose();
        },
        (errorMessage) => {

        }
      );
    } catch (error) {
      console.error('Scanner start error:', error);
      toast.error('Scanner failed', 'Could not start camera');
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && scanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        setScanning(false);
      } catch (error) {
        console.error('Stop scanning error:', error);
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
        <DialogTitle>Scan Barcode / QR Code</DialogTitle>
      </DialogHeader>

      <DialogContent>
        <div className="space-y-4">
          { }
          {/* Always show camera selector when multiple cameras exist */}
          {cameras.length > 1 && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Select Active Camera
              </label>
              <select
                value={selectedCamera}
                onChange={async (e) => {
                  const newCamera = e.target.value;
                  setSelectedCamera(newCamera);
                  if (scanning) {
                    await stopScanning();
                    setTimeout(() => startScanning(newCamera), 100);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                {cameras.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label || `Camera ${camera.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          { }
          <div className="relative">
            <div
              id="qr-reader"
              className="w-full rounded-lg overflow-hidden bg-gray-900"
              style={{ minHeight: '300px' }}
            />

            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
                <div className="text-center text-white">
                  <Loader className="w-16 h-16 mx-auto mb-4 animate-spin text-blue-500" />
                  <p className="text-lg mb-4">Connecting to camera...</p>
                  <Button
                    variant="primary"
                    onClick={() => startScanning()}
                    leftIcon={<Camera className="w-5 h-5" />}
                    disabled={!selectedCamera}
                  >
                    Retry Camera
                  </Button>
                </div>
              </div>
            )}

            {scanning && (
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-lg">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Scanning...</span>
                </div>
              </div>
            )}
          </div>

          { }
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm">
              Scanning Tips
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Hold the camera steady over the barcode/QR code</li>
              <li>• Ensure good lighting for better results</li>
              <li>• Keep the code within the scanning frame</li>
              <li>• Works with barcodes (EAN, UPC) and QR codes</li>
            </ul>
          </div>

          { }
          {cameraPermission === 'denied' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Camera access denied.</strong> Please enable camera permissions in your browser settings.
              </p>
            </div>
          )}

          { }
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Or enter code manually:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter barcode or product code"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    onScan(e.currentTarget.value);
                    handleClose();
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>('input[type="text"]');
                  if (input?.value) {
                    onScan(input.value);
                    handleClose();
                  }
                }}
              >
                Submit
              </Button>
            </div>
          </div>

          { }
          <Button
            variant="secondary"
            onClick={handleClose}
            className="w-full"
            leftIcon={<X className="w-4 h-4" />}
          >
            Close Scanner
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
