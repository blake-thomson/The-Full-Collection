/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export interface PickerResult {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  thumbnailLink?: string;
  webContentLink?: string;
  modifiedTime?: string;
  size?: string;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function loadGapiPicker(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.gapi?.client?.getToken) {
      resolve();
      return;
    }
    window.gapi.load("picker", {
      callback: () => resolve(),
      onerror: () => reject(new Error("Failed to load Google Picker")),
    });
  });
}

export async function openGooglePicker(accessToken: string): Promise<PickerResult | null> {
  // Load the gapi script if not present
  await loadScript("https://apis.google.com/js/api.js");
  await loadGapiPicker();

  // Also load the Google Identity Services / Picker API v2 support
  await loadScript("https://accounts.google.com/gsi/client");

  return new Promise((resolve) => {
    const docsView = new window.google.picker.DocsView()
      .setIncludeFolders(false)
      .setSelectFolderEnabled(false);

    const videoView = new window.google.picker.DocsView()
      .setMimeTypes("video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-matroska")
      .setIncludeFolders(false);

    const imageView = new window.google.picker.DocsView()
      .setMimeTypes("image/jpeg,image/png,image/gif,image/webp,image/svg+xml")
      .setIncludeFolders(false);

    const picker = new window.google.picker.PickerBuilder()
      .addView(docsView)
      .addView(videoView)
      .addView(imageView)
      .setOAuthToken(accessToken)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const doc = data.docs[0];
          resolve({
            id: doc.id,
            name: doc.name,
            mimeType: doc.mimeType,
            url: doc.url,
            thumbnailLink: doc.thumbnails?.[0]?.url || undefined,
            webContentLink: undefined,
            modifiedTime: doc.lastEditedUtc
              ? new Date(doc.lastEditedUtc).toISOString()
              : undefined,
            size: doc.sizeBytes ? String(doc.sizeBytes) : undefined,
          });
        } else if (data.action === window.google.picker.Action.CANCEL) {
          resolve(null);
        }
      })
      .setTitle("Attach a file from Google Drive")
      .build();

    picker.setVisible(true);
  });
}
