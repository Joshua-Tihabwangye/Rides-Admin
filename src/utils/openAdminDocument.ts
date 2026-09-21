import { getFreshFileDownloadUrl } from "../services/api/adminApi";

type AdminDocumentLink = {
  fileUrl?: string | null;
  fileAssetId?: string | null;
};

export async function openAdminDocument(document: AdminDocumentLink): Promise<void> {
  const popup = window.open("about:blank", "_blank");
  if (popup) {
    popup.opener = null;
  }

  try {
    const url = await getFreshFileDownloadUrl(document.fileUrl, document.fileAssetId);
    if (popup) {
      popup.location.href = url;
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  } catch (error) {
    popup?.close();
    throw error;
  }
}
