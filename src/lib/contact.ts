export const CONTACT_CATEGORIES = [
  "대회 등록 요청",
  "정정 요청",
  "버그 제보",
  "기타 문의",
] as const;

export const MAX_CONTACT_ATTACHMENT_COUNT = 5;
export const MAX_CONTACT_ATTACHMENT_SIZE = 10 * 1024 * 1024;

export const CONTACT_ATTACHMENT_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
  ".doc",
  ".docx",
  ".hwp",
] as const;

export const CONTACT_ATTACHMENT_ACCEPT = CONTACT_ATTACHMENT_EXTENSIONS.join(",");

export const CONTACT_ATTACHMENT_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/x-hwp",
  "application/haansofthwp",
  "application/vnd.hancom.hwp",
] as const;

export type ContactBlobAccess = "private" | "public";

export function getContactBlobAccess(): ContactBlobAccess {
  return process.env.NEXT_PUBLIC_CONTACT_BLOB_ACCESS === "public"
    ? "public"
    : "private";
}

export function isAllowedContactAttachmentName(filename: string) {
  const lowerFilename = filename.toLowerCase();

  return CONTACT_ATTACHMENT_EXTENSIONS.some((extension) =>
    lowerFilename.endsWith(extension),
  );
}

export function getContactAttachmentContentType(file: File) {
  if (file.type && file.type !== "application/octet-stream") {
    return file.type;
  }

  const lowerFilename = file.name.toLowerCase();

  if (lowerFilename.endsWith(".hwp")) return "application/x-hwp";
  if (lowerFilename.endsWith(".doc")) return "application/msword";
  if (lowerFilename.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lowerFilename.endsWith(".pdf")) return "application/pdf";
  if (lowerFilename.endsWith(".png")) return "image/png";
  if (lowerFilename.endsWith(".webp")) return "image/webp";
  if (lowerFilename.endsWith(".jpg") || lowerFilename.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  return "application/octet-stream";
}

export function isAllowedContactAttachmentContentType(contentType: string) {
  return CONTACT_ATTACHMENT_CONTENT_TYPES.some((allowedType) =>
    contentType.toLowerCase().startsWith(allowedType),
  );
}
