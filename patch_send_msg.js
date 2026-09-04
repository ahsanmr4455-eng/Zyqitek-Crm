const fs = require('fs');

const path = 'src/components/PortalChat.tsx';
let code = fs.readFileSync(path, 'utf8');

const target = `    let attachmentObj: PortalMessage['attachment'] = undefined;
    let voiceBase64: string | undefined = undefined;

    // Process file attachment
    if (fileToUpload) {
      setIsUploading(true);
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(fileToUpload);
        });

        attachmentObj = {
          id: \`att-\${Date.now()}\`,
          fileName: fileToUpload.name,
          fileType: fileToUpload.type || 'application/octet-stream',
          fileSize: formatBytes(fileToUpload.size),
          fileUrl: base64Data,
          downloadUrl: base64Data
        };
      } catch (err) {
        console.error('Attachment encoding error:', err);
        showToast('Failed to process attachment.', 'error');
        setIsUploading(false);
        setIsSending(false);
        return;
      }
      setIsUploading(false);
    }

    // Process voice note
    if (voiceBlob) {
      try {
        voiceBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(voiceBlob);
        });
      } catch (err) {
        console.error('Voice encoding error:', err);
        showToast('Failed to process voice note.', 'error');
        setIsSending(false);
        return;
      }
    }`;

const replacement = `    let attachmentObj: PortalMessage['attachment'] = undefined;
    let voiceUrlStr: string | undefined = undefined;

    const { canonicalPortalId, canonicalPortalType, primaryConvId } = computeCanonicalIds();

    // Process file attachment via Firebase Storage / uploadPortalFile
    if (fileToUpload) {
      setIsUploading(true);
      try {
        const folderPath = \`portals/\${canonicalPortalId}/chat_attachments\`;
        const uploadRes = await uploadPortalFile(fileToUpload, folderPath);
        attachmentObj = {
          id: \`att-\${Date.now()}\`,
          fileName: uploadRes.fileName,
          fileType: uploadRes.contentType || fileToUpload.type || 'application/octet-stream',
          fileSize: uploadRes.size,
          fileUrl: uploadRes.fileUrl,
          downloadUrl: uploadRes.downloadUrl,
          storagePath: uploadRes.storagePath
        };
      } catch (err) {
        console.error('Attachment upload error:', err);
        showToast('Failed to process attachment.', 'error');
        setIsUploading(false);
        setIsSending(false);
        return;
      }
      setIsUploading(false);
    }

    // Process voice note via Firebase Storage / uploadPortalFile
    if (voiceBlob) {
      try {
        const voiceFile = new File([voiceBlob], \`voice_\${Date.now()}.webm\`, { type: 'audio/webm' });
        const folderPath = \`portals/\${canonicalPortalId}/voice_notes\`;
        const uploadRes = await uploadPortalFile(voiceFile, folderPath);
        voiceUrlStr = uploadRes.fileUrl;
      } catch (err) {
        console.error('Voice upload error:', err);
        showToast('Failed to process voice note.', 'error');
        setIsSending(false);
        return;
      }
    }`;

code = code.replace(target, replacement);

const targetMsgCreation = `      status: 'sent',
      type: voiceBase64 ? 'voice' : attachmentObj ? 'file' : 'text',
      ...(voiceBase64 ? { voiceUrl: voiceBase64, voiceDuration: voiceDurationSec } : {}),`;

const replacementMsgCreation = `      status: 'sent',
      type: voiceUrlStr ? 'voice' : attachmentObj ? 'file' : 'text',
      ...(voiceUrlStr ? { voiceUrl: voiceUrlStr, voiceDuration: voiceDurationSec } : {}),
      replyToMessageId: replyingToMessage ? replyingToMessage.id : undefined,`;

code = code.replace(targetMsgCreation, replacementMsgCreation);

const targetCleanup = `    setRecordedAudioUrl(null);
    }
    setRecordingDuration(0);
    setIsPlayingPreview(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const { canonicalPortalId, canonicalPortalType, primaryConvId } = computeCanonicalIds();`;

const replacementCleanup = `    setRecordedAudioUrl(null);
    }
    setRecordingDuration(0);
    setIsPlayingPreview(false);
    setReplyingToMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';`;

code = code.replace(targetCleanup, replacementCleanup);


fs.writeFileSync(path, code);
console.log('Patched send message!');
