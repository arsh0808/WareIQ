'use client';

import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import { X, Info } from 'lucide-react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
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
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (open) {
      // Small timeout to ensure DialogContent is rendered before attaching scanner
      const timer = setTimeout(() => {
        scanner = new Html5QrcodeScanner(
          'qr-reader-container',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            rememberLastUsedCamera: true,
          },
          false // verbose logging disabled
        );

        scanner.render(
          (decodedText) => {
            toast.success('Code scanned!', decodedText);
            onScan(decodedText);

            // Clean up cleanly on exit
            if (scanner) {
              scanner.clear().catch(console.error);
            }
            onClose();
          },
          (errorMessage) => {
            // Internal read errors happen constantly on partial frames, so we ignore them to avoid spam
          }
        );
      }, 100);

      return () => clearTimeout(timer);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error('Failed to clear scanner on unmount', e));
      }
    };
  }, [open, onClose, onScan]);

  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <DialogHeader>
        <DialogTitle>Scan Barcode / QR Code</DialogTitle>
      </DialogHeader>

      <DialogContent>
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                Camera System Ready
              </h4>
              <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                The scanner will automatically request permissions below. If it fails to load, ensure you are connected securely via HTTPS/localhost.
              </p>
            </div>
          </div>

          {/* This container will be fully managed by Html5QrcodeScanner for maximum reliability */}
          <div
            id="qr-reader-container"
            className="w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
            style={{ minHeight: '300px' }}
          />

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Or enter code manually:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                id="manual-code-input"
                placeholder="Enter barcode or product code"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    onScan(e.currentTarget.value);
                    onClose();
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>('#manual-code-input');
                  if (input?.value) {
                    onScan(input.value);
                    onClose();
                  }
                }}
              >
                Submit
              </Button>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={onClose}
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
