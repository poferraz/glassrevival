// File reading utility for CSV files

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('File reading error'));
    };
    
    reader.readAsText(file, 'utf-8');
  });
}

export function validateCSVFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }
  
  if (file.size === 0) {
    return { isValid: false, error: 'File is empty' };
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    return { isValid: false, error: 'File is too large (max 10MB)' };
  }
  
  const validTypes = ['text/csv', 'application/csv'];
  const hasValidType = validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.csv');
  
  if (!hasValidType) {
    return { isValid: false, error: 'Invalid file type. Please select a CSV file.' };
  }
  
  return { isValid: true };
}