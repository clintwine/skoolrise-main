import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function Scanner({ 
  isOpen, 
  onClose, 
  onScanSuccess, 
  onScanError,
  title = "Scan QR/Barcode",
  description = "Position the code within the frame"
}) {
  const [scanner, setScanner] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && !scanner) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: [
            0, // QR_CODE
            1, // UPC_A
            2, // UPC_E
            3, // EAN_8
            4, // EAN_13
            7, // CODE_39
            8, // CODE_93
            9, // CODE_128
            10, // ITF
          ]
        },
        false
      );

      html5QrcodeScanner.render(
        (decodedText, decodedResult) => {
          setScanResult(decodedText);
          html5QrcodeScanner.clear();
          if (onScanSuccess) {
            onScanSuccess(decodedText);
          }
        },
        (errorMessage) => {
          // Ignore frequent scanning errors
          if (!errorMessage.includes('NotFoundException')) {
            setError(errorMessage);
            if (onScanError) {
              onScanError(errorMessage);
            }
          }
        }
      );

      setScanner(html5QrcodeScanner);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error('Error clearing scanner:', err));
      }
    };
  }, [isOpen]);

  const handleClose = () => {
    if (scanner) {
      scanner.clear().catch(err => console.error('Error clearing scanner:', err));
      setScanner(null);
    }
    setScanResult(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              <DialogTitle className="text-gray-900">{title}</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">{description}</p>
        </DialogHeader>

        <div className="space-y-4">
          {scanResult ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-900">Scan Successful!</span>
              </div>
              <div className="bg-white rounded p-3 border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Scanned Data:</p>
                <code className="text-sm font-mono text-gray-900 break-all">{scanResult}</code>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            </div>
          ) : null}

          <div id="qr-reader" className="rounded-lg overflow-hidden border-2 border-gray-200"></div>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Badge variant="outline" className="text-xs">QR Code</Badge>
            <Badge variant="outline" className="text-xs">Barcode</Badge>
            <Badge variant="outline" className="text-xs">ISBN</Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}