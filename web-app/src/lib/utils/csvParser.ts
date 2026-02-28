export interface CsvRow {
  [key: string]: string;
}

export const parseCSV = (content: string): CsvRow[] => {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: CsvRow = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }

  return rows;
};

export const generateCSVTemplate = (headers: string[]): string => {
  return headers.join(',') + '\n';
};

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const validateInventoryCSV = (rows: CsvRow[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const requiredFields = ['productId', 'quantity', 'shelfId', 'minStockLevel', 'maxStockLevel'];

  if (rows.length === 0) {
    errors.push('CSV file is empty');
    return { valid: false, errors };
  }

  const headers = Object.keys(rows[0]);
  const missingFields = requiredFields.filter(field => !headers.includes(field));
  
  if (missingFields.length > 0) {
    errors.push(`Missing required fields: ${missingFields.join(', ')}`);
  }

  rows.forEach((row, index) => {
    const rowNum = index + 2; 

    requiredFields.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        errors.push(`Row ${rowNum}: Missing ${field}`);
      }
    });

    const quantity = parseInt(row.quantity);
    const minStockLevel = parseInt(row.minStockLevel);
    const maxStockLevel = parseInt(row.maxStockLevel);

    if (isNaN(quantity) || quantity < 0) {
      errors.push(`Row ${rowNum}: Invalid quantity`);
    }

    if (isNaN(minStockLevel) || minStockLevel < 0) {
      errors.push(`Row ${rowNum}: Invalid minStockLevel`);
    }

    if (isNaN(maxStockLevel) || maxStockLevel < 0) {
      errors.push(`Row ${rowNum}: Invalid maxStockLevel`);
    }

    if (minStockLevel > maxStockLevel) {
      errors.push(`Row ${rowNum}: minStockLevel cannot be greater than maxStockLevel`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};
