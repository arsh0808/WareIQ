'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import { FileUpload } from './ui/FileUpload';
import { parseCSV, validateInventoryCSV, generateCSVTemplate } from '@/lib/utils/csvParser';
import { collection, addDoc, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from '@/lib/hooks/useToast';
import { Download, Upload, AlertTriangle, CheckCircle, Loader } from 'lucide-react';

interface BulkImportDialogProps {
  open: boolean;
  onClose: () => void;
  warehouseId: string;
}

export const BulkImportDialog: React.FC<BulkImportDialogProps> = ({
  open,
  onClose,
  warehouseId,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setErrors([]);
    setPreview([]);

    try {
      const content = await selectedFile.text();
      const rows = parseCSV(content);
      
      const validation = validateInventoryCSV(rows);
      
      if (!validation.valid) {
        setErrors(validation.errors);
        toast.error('Validation failed', `Found ${validation.errors.length} error(s)`);
      } else {
        setPreview(rows.slice(0, 5)); 
        toast.success('File validated', `${rows.length} rows ready to import`);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Failed to read file', 'Please check the file format');
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);

    try {
      const content = await file.text();
      const rows = parseCSV(content);
      
      const validation = validateInventoryCSV(rows);
      if (!validation.valid) {
        setErrors(validation.errors);
        setImporting(false);
        return;
      }

      const batch = writeBatch(db);
      const inventoryRef = collection(db, 'inventory');

      rows.forEach((row) => {
        const newDocRef = doc(inventoryRef);
        batch.set(newDocRef, {
          productId: row.productId,
          warehouseId: warehouseId,
          shelfId: row.shelfId,
          quantity: parseInt(row.quantity),
          minStockLevel: parseInt(row.minStockLevel),
          maxStockLevel: parseInt(row.maxStockLevel),
          lastUpdated: new Date(),
          createdAt: new Date(),
        });
      });

      await batch.commit();

      toast.success('Import successful!', `Imported ${rows.length} items`);
      onClose();
      setFile(null);
      setPreview([]);
      setErrors([]);
    } catch (error) {
      console.error('Error importing:', error);
      toast.error('Import failed', 'Please try again');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ['productId', 'quantity', 'shelfId', 'minStockLevel', 'maxStockLevel'];
    const template = generateCSVTemplate(headers);
    const exampleRow = 'PROD-001,100,A1-SHELF-01,20,500';
    const fullTemplate = template + exampleRow;

    const blob = new Blob([fullTemplate], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inventory_import_template.csv';
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Template downloaded', 'Fill in your data and upload');
  };

  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <DialogHeader>
        <DialogTitle>Bulk Import Inventory</DialogTitle>
      </DialogHeader>

      <DialogContent>
        <div className="space-y-6">
          {}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Import Instructions
            </h4>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              <li>Download the CSV template</li>
              <li>Fill in your inventory data</li>
              <li>Upload the completed file</li>
              <li>Review the preview and click Import</li>
            </ol>
          </div>

          {}
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            leftIcon={<Download className="w-4 h-4" />}
            className="w-full"
          >
            Download CSV Template
          </Button>

          {}
          <FileUpload
            onFileSelect={handleFileSelect}
            accept=".csv"
            maxSize={5}
          />

          {}
          {errors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-60 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h4 className="font-semibold text-red-900 dark:text-red-100">
                  Validation Errors ({errors.length})
                </h4>
              </div>
              <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                {errors.slice(0, 10).map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
                {errors.length > 10 && (
                  <li className="font-semibold">... and {errors.length - 10} more errors</li>
                )}
              </ul>
            </div>
          )}

          {}
          {preview.length > 0 && errors.length === 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h4 className="font-semibold text-green-900 dark:text-green-100">
                  Preview (First 5 rows)
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-green-200 dark:border-green-800">
                      {Object.keys(preview[0]).map((header) => (
                        <th key={header} className="px-3 py-2 text-left text-green-900 dark:text-green-100 font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, index) => (
                      <tr key={index} className="border-b border-green-100 dark:border-green-900">
                        {Object.values(row).map((value: any, i) => (
                          <td key={i} className="px-3 py-2 text-green-800 dark:text-green-200">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      <DialogFooter>
        <Button
          variant="primary"
          onClick={handleImport}
          disabled={!file || errors.length > 0 || importing}
          isLoading={importing}
          leftIcon={!importing ? <Upload className="w-4 h-4" /> : undefined}
        >
          {importing ? 'Importing...' : 'Import Data'}
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={importing}>
          Cancel
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
