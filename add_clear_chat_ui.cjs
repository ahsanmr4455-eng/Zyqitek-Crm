const fs = require('fs');
let code = fs.readFileSync('src/components/PortalChat.tsx', 'utf8');

// Replace "Delete for everyone" and "Delete for me" with just "Delete" mapped to the modal.
// We'll also add "Clear Data" option.
code = code.replace(
  /<button\n\s*type="button"\n\s*onClick=\{\(\) => handleDeleteMessage\(selectedMessageForAction, 'for_me'\)\}\n\s*className="w-full flex items-center gap-2\.5 px-3 py-2\.5 hover:bg-rose-50 text-rose-600 rounded-xl font-semibold text-xs transition-colors cursor-pointer text-left"\n\s*>\n\s*<Trash2 size=\{15\} \/>\n\s*<span>Delete for me<\/span>\n\s*<\/button>\n\s*\{canDeleteMessage\(selectedMessageForAction\) && \(\n\s*<button\n\s*type="button"\n\s*onClick=\{\(\) => \{\n\s*const targetMsg = selectedMessageForAction;\n\s*setSelectedMessageForAction\(null\);\n\s*setMessageToDelete\(targetMsg\);\n\s*\}\}\n\s*className=\{`w-full flex items-center gap-2\.5 px-3 py-2\.5 rounded-xl font-medium text-xs transition-colors cursor-pointer text-left \$\{mode === 'admin' \? 'hover:bg-rose-500\/10 text-rose-500' : 'hover:bg-rose-50 text-rose-600'\}[\s\S]*?<\/button>\n\s*\)\}/g,
  `{canDeleteMessage(selectedMessageForAction) && (
              <button
                type="button"
                onClick={() => {
                  const targetMsg = selectedMessageForAction;
                  setSelectedMessageForAction(null);
                  setMessageToDelete(targetMsg);
                }}
                className={\`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium text-xs transition-colors cursor-pointer text-left \${mode === 'admin' ? 'hover:bg-rose-500/10 text-rose-500' : 'hover:bg-rose-50 text-rose-600'}\`}
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
            )}
            
            {canDeleteMessage(selectedMessageForAction) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedMessageForAction(null);
                  setIsClearChatConfirmOpen(true);
                }}
                className={\`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium text-xs transition-colors cursor-pointer text-left \${mode === 'admin' ? 'hover:bg-rose-500/10 text-rose-500' : 'hover:bg-rose-50 text-rose-600'}\`}
              >
                <Trash2 size={15} />
                <span>Clear Data</span>
              </button>
            )}`
);

// We need to add the confirmation dialog for Clear Chat right after the Delete Confirmation Dialog
code = code.replace(
  /\{\/\* Fullscreen Image Preview Modal \*\/\}/g,
  `{/* Clear Chat Confirmation Dialog */}
      {isClearChatConfirmOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsClearChatConfirmOpen(false)}
        >
          <div 
            className={\`rounded-2xl shadow-2xl p-5 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-150 \${mode === 'admin' ? 'bg-[var(--crm-card)] border border-[var(--crm-card-border)]' : 'bg-white border border-slate-200'}\`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className={\`w-10 h-10 rounded-full flex items-center justify-center shrink-0 \${mode === 'admin' ? 'bg-rose-500/10 text-rose-500' : 'bg-rose-100 text-rose-600'}\`}>
                <Trash2 size={20} />
              </div>
              <div>
                <h4 className={\`text-sm font-bold \${mode === 'admin' ? 'text-[var(--crm-heading)]' : 'text-slate-900'}\`}>Clear chat?</h4>
                <p className={\`text-xs mt-0.5 \${mode === 'admin' ? 'text-[var(--crm-text-muted)]' : 'text-slate-500'}\`}>
                  This will clear all messages in this conversation.
                </p>
              </div>
            </div>
            <div className={\`flex items-center justify-end gap-2 pt-2 border-t \${mode === 'admin' ? 'border-[var(--crm-card-border)]' : 'border-slate-100'}\`}>
              <button
                type="button"
                onClick={() => setIsClearChatConfirmOpen(false)}
                className={\`px-4 py-2 rounded-xl font-medium text-xs transition-colors cursor-pointer \${mode === 'admin' ? 'bg-[var(--crm-sidebar)] hover:bg-slate-200/10 text-[var(--crm-text)]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}\`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearChat}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer shadow-sm shadow-rose-600/20"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Preview Modal */}`
);

fs.writeFileSync('src/components/PortalChat.tsx', code);
console.log('UI updated');
