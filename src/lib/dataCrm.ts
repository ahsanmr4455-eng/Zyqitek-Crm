import { getCollectionOnce, saveToFirestore } from './firebaseSync';

export const CRM_COLLECTIONS = [
  'leads',
  'calls',
  'clients',
  'projects',
  'team',
  'goals',
  'emailDiscussions',
  'callDiscussions',
  'conversationDiscussions',
  'settings',
  'proposals',
  'pricingCatalog',
  'clientPortals',
  'teamPortals',
  'teamInternalFiles',
  'paymentDetails',
  'callScripts',
  'emailScripts'
];

export async function exportCrmData() {
  const exportData: Record<string, any> = {};
  
  for (const collection of CRM_COLLECTIONS) {
    try {
      const items = await getCollectionOnce(collection);
      exportData[collection] = items;
    } catch (err) {
      console.error(`Error exporting collection ${collection}:`, err);
      exportData[collection] = [];
    }
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = `zyqro_crm_backup_${date}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return true;
}

export async function importCrmData(jsonData: string) {
  try {
    const data = JSON.parse(jsonData);
    const importPromises: Promise<any>[] = [];

    for (const collection of CRM_COLLECTIONS) {
      const items = data[collection];
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item && item.id) {
            importPromises.push(saveToFirestore(collection, String(item.id), item));
          } else if (collection === 'settings' && item) {
             // Handle settings specifically if needed (usually a single doc 'general')
             importPromises.push(saveToFirestore('settings', 'general', item));
          }
        }
      } else if (collection === 'settings' && items && !Array.isArray(items)) {
        // Fallback for settings if exported as single object
        importPromises.push(saveToFirestore('settings', 'general', items));
      }
    }

    if (importPromises.length === 0) {
      throw new Error('No valid data found to import.');
    }

    await Promise.all(importPromises);
    return true;
  } catch (err) {
    console.error('Error importing CRM data:', err);
    throw err;
  }
}
