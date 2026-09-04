/**
 * CRM Utility functions
 */

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;
  
  // Format complex values safely
  const flattenVal = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') {
      try {
        return JSON.stringify(val);
      } catch (e) {
        return '';
      }
    }
    return String(val);
  };

  const keys = Object.keys(data[0]);
  const headers = keys.map(key => {
    let h = String(key).replace(/"/g, '""');
    if (h.includes(',') || h.includes('\n') || h.includes('"')) {
      h = `"${h}"`;
    }
    return h;
  }).join(',');
  const rows = data.map(row => 
    keys.map(key => {
      let cell = flattenVal(row[key]);
      cell = cell.replace(/"/g, '""');
      if (cell.includes(',') || cell.includes('\n') || cell.includes('"')) {
        cell = `"${cell}"`;
      }
      return cell;
    }).join(',')
  );
  
  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const generateUniqueId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};
