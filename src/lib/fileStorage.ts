/**
 * File Storage & Transfer Manager
 * Provides real-time uploading, streaming download with progress tracking,
 * and reliable file synchronization with Firebase Storage / backend persistence.
 */

export interface UploadProgressCallback {
  (progress: number, loadedBytes: number, totalBytes: number): void;
}

export interface DownloadProgressCallback {
  (progress: number, loadedBytes: number, totalBytes: number): void;
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${val} ${sizes[i]}`;
}

export interface UploadResult {
  fileUrl: string;
  downloadUrl?: string;
  size: string;
  fileSizeRaw: number;
  fileName: string;
  storagePath?: string;
  contentType?: string;
}

/**
 * Uploads a file to Firebase Storage architecture via backend API route with live progress tracking and cancellation support.
 */
export async function uploadPortalFile(
  file: File, 
  folderPath: string, 
  onProgress?: UploadProgressCallback,
  abortController?: AbortController
): Promise<UploadResult> {
  const fileName = file.name;
  const sizeFormatted = formatBytes(file.size);

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderPath', folderPath);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/portal/storage/upload', true);

    if (abortController) {
      abortController.signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new DOMException('Upload was cancelled by user', 'AbortError'));
      });
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
        onProgress(percent, event.loaded, event.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.fileUrl || data.downloadUrl) {
            if (onProgress) {
              onProgress(100, file.size, file.size);
            }
            resolve({ 
              fileUrl: data.fileUrl || data.downloadUrl,
              downloadUrl: data.downloadUrl || data.fileUrl,
              size: data.size ? formatBytes(Number(data.size)) : sizeFormatted,
              fileSizeRaw: data.size ? Number(data.size) : file.size,
              fileName: data.fileName || fileName,
              storagePath: data.storagePath,
              contentType: data.contentType || file.type
            });
          } else {
            reject(new Error(data.error || 'Upload failed: Server did not return file url'));
          }
        } catch (err: any) {
          reject(new Error('Failed to parse upload response from server'));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData.error || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with server status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during file upload. Please check your connection.'));
    };

    xhr.onabort = () => {
      reject(new DOMException('Upload was cancelled by user', 'AbortError'));
    };

    xhr.send(formData);
  });
}

/**
 * Downloads a file with real-time percentage and byte progress tracking, then triggers the native browser save dialog.
 */
export async function downloadPortalFile(
  fileUrl: string, 
  fileName: string,
  onProgress?: DownloadProgressCallback,
  abortController?: AbortController
): Promise<void> {
  return new Promise((resolve, reject) => {
    // If it's a direct Base64 Data URL
    if (fileUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (onProgress) onProgress(100, 100, 100);
      return resolve();
    }

    const xhr = new XMLHttpRequest();
    // Ensure download query flag is appended for attachment disposition
    const downloadUrl = fileUrl.includes('?') 
      ? (fileUrl.includes('download=') ? fileUrl : `${fileUrl}&download=1`) 
      : `${fileUrl}?download=1`;

    xhr.open('GET', downloadUrl, true);
    xhr.responseType = 'blob';

    if (abortController) {
      abortController.signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new DOMException('Download was cancelled by user', 'AbortError'));
      });
    }

    xhr.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
        onProgress(percent, event.loaded, event.total);
      } else if (onProgress && event.loaded) {
        // Fallback for unknown total length
        onProgress(50, event.loaded, event.loaded);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const blob = xhr.response;
        if (onProgress && blob.size) {
          onProgress(100, blob.size, blob.size);
        }
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
        resolve();
      } else {
        reject(new Error(`Download failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during file download.'));
    };

    xhr.onabort = () => {
      reject(new DOMException('Download was cancelled by user', 'AbortError'));
    };

    xhr.send();
  });
}

/**
 * Deletes a file from storage bucket or persistent volume.
 */
export async function deletePortalFile(fileUrl: string, storagePath?: string): Promise<void> {
  if (!fileUrl || fileUrl.startsWith('data:')) {
    return;
  }
  try {
    await fetch('/api/portal/storage/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileUrl, storagePath })
    });
  } catch (err) {
    console.warn('Storage file deletion warning:', err);
  }
}
