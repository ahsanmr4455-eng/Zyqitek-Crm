const fs = require('fs');
let code = fs.readFileSync('src/components/PortalChat.tsx', 'utf8');

// 1. Add state for isClearChatConfirmOpen
code = code.replace(
  /const \[messageToDelete, setMessageToDelete\] = useState<PortalMessage \| null>\(null\);/g,
  `const [messageToDelete, setMessageToDelete] = useState<PortalMessage | null>(null);\n  const [isClearChatConfirmOpen, setIsClearChatConfirmOpen] = useState(false);`
);

// 2. Add handleClearChat function
code = code.replace(
  /\/\/ Handle Message Soft Deletion/g,
  `// Handle Clear Chat
  const handleClearChat = async () => {
    setIsClearChatConfirmOpen(false);
    setSelectedMessageForAction(null);
    try {
      const msgsToClear = allMessagesList.filter(m => m.conversationId === selectedConversationId && !m.isDeleted);
      const batchWrites = [];
      const myId = mode === 'portal' ? (effectivePortalId || portalId) : 'admin';
      
      for (const msg of msgsToClear) {
        batchWrites.push(
          updateDoc(doc(db, 'portalMessages', msg.id), {
            isDeleted: true,
            deletedAt: new Date().toISOString(),
            deletedBy: myId,
            deletedRole: currentUserRole,
            deleteScope: 'for_everyone'
          })
        );
      }
      await Promise.all(batchWrites);
      showToast('Chat cleared.', 'success');
    } catch (err) {
      console.error('Clear chat error:', err);
      showToast('Failed to clear chat.', 'error');
    }
  };

  // Handle Message Soft Deletion`
);

fs.writeFileSync('src/components/PortalChat.tsx', code);
console.log('Added handleClearChat');
