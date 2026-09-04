const fs = require('fs');

let content = fs.readFileSync('src/components/LeadManager.tsx', 'utf8');

// Bypass the preview modal and import directly
const bypassLogic = `        // Streamlined Import: Bypass the preview modal and import directly
        const selectedHeaders = [...headers];
        const newDynamicColIds = selectedHeaders.map(h => \`cf_\$\{h\}\`);
        
        setColumnOrder(prev => {
          const existing = new Set(prev);
          const toAdd = newDynamicColIds.filter(id => !existing.has(id));
          const actionsIdx = prev.indexOf('actions');
          if (actionsIdx > -1) {
            const next = [...prev];
            next.splice(actionsIdx, 0, ...toAdd);
            return next;
          }
          return [...prev, ...toAdd];
        });
        
        setVisibleColumns(prev => {
          const next = { ...prev };
          newDynamicColIds.forEach(id => {
            if (next[id] === undefined) next[id] = true;
          });
          return next;
        });

        try {
          if (onBulkImportLeads) {
            const res = await onBulkImportLeads(leadsToImport);
            console.log("[Final import summary] Result from onBulkImportLeads:", res);
            setImportSummary({
              total: res.total || leadsToImport.length,
              imported: res.imported,
              failed: res.failed || 0,
              duplicates: res.duplicates || 0,
              show: true,
              error: res.error
            });
          } else {
            let importedCount = 0;
            let failedCount = 0;
            for (const item of leadsToImport) {
              const success = await onAddLead(item);
              if (success) {
                importedCount++;
              } else {
                failedCount++;
              }
            }
            setImportSummary({
              total: leadsToImport.length,
              imported: importedCount,
              failed: failedCount,
              duplicates: 0,
              show: true
            });
          }
          showToast(\`Imported \$\{leadsToImport.length\} records with dynamic columns!\`, "success");
        } catch (err) {
          console.error("[CSV Import Execution Error]:", err);
          showToast(\`Import failed: \$\{err?.message || "Unknown error"\}\`, "error");
          setImportSummary({
            total: leadsToImport.length,
            imported: 0,
            failed: leadsToImport.length,
            duplicates: 0,
            show: true,
            error: err?.message || "Failed to save leads."
          });
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }`;

// Replace the setCsvPreviewData call
content = content.replace(
  /\/\/ Open CSV Preview Modal to let user review detected columns and data before importing[\s\S]*?setCsvPreviewData\(\{[\s\S]*?leadsToImport: leadsToImport\s*\}\);/,
  bypassLogic
);

// We can also remove the preview modal UI block if we want, but just bypassing it is enough.
// Actually, let's remove the preview modal UI so it's clean.
content = content.replace(
  /\{\/\* CSV Preview & Dynamic Column Confirmation Modal \*\/\}[\s\S]*?\{\/\* Import Summary Feedback Modal \*\/}/,
  "{/* Import Summary Feedback Modal */}"
);

// And we can remove handleConfirmCSVImport since it's no longer used.
content = content.replace(
  /\/\/ Confirm CSV Import after preview[\s\S]*?\/\/ Handle CSV File Input Change/,
  "// Handle CSV File Input Change"
);

fs.writeFileSync('src/components/LeadManager.tsx', content);

