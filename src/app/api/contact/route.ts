import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  CONTACT_CATEGORIES,
  MAX_CONTACT_ATTACHMENT_COUNT,
  MAX_CONTACT_ATTACHMENT_SIZE,
  getContactBlobAccess,
  isAllowedContactAttachmentContentType,
  isAllowedContactAttachmentName,
} from "@/lib/contact";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type ContactPayload = {
  category?: unknown;
  name?: unknown;
  email?: unknown;
  message?: unknown;
  website?: unknown;
  attachments?: unknown;
};

type ContactAttachmentPayload = {
  originalName?: unknown;
  pathname?: unknown;
  url?: unknown;
  downloadUrl?: unknown;
  contentType?: unknown;
  size?: unknown;
  access?: unknown;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as ContactPayload;

  if (typeof payload.website === "string" && payload.website.trim()) {
    return NextResponse.json({ ok: true }, { status: 202 });
  }

  const category = getString(payload.category);
  const name = getString(payload.name);
  const email = getString(payload.email).toLowerCase();
  const message = getString(payload.message);

  if (!CONTACT_CATEGORIES.some((item) => item === category)) {
    return badRequest("문의 유형을 선택해주세요.");
  }

  if (name.length < 2 || name.length > 80) {
    return badRequest("이름 또는 단체명을 2자 이상 입력해주세요.");
  }

  if (!isValidEmail(email)) {
    return badRequest("답변을 받을 이메일 주소를 확인해주세요.");
  }

  if (message.length < 10 || message.length > 5000) {
    return badRequest("문의 내용은 10자 이상 5000자 이하로 입력해주세요.");
  }

  let attachments: ReturnType<typeof normalizeAttachments>;

  try {
    attachments = normalizeAttachments(payload.attachments);
  } catch (error) {
    if (error instanceof ContactValidationError) {
      return badRequest(error.message);
    }

    throw error;
  }

  const inquiry = await prisma.contactInquiry.create({
    data: {
      category,
      name,
      email,
      message,
      attachments: {
        create: attachments,
      },
    },
    select: {
      id: true,
    },
  });

  revalidatePath("/admin");

  return NextResponse.json({ ok: true, id: inquiry.id }, { status: 201 });
}

function normalizeAttachments(value: unknown) {
  if (value == null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new ContactValidationError("첨부 파일 정보가 올바르지 않습니다.");
  }

  if (value.length > MAX_CONTACT_ATTACHMENT_COUNT) {
    throw new ContactValidationError("첨부 파일은 최대 5개까지 등록할 수 있어요.");
  }

  return value.map((item) => {
    const attachment = item as ContactAttachmentPayload;
    const originalName = getString(attachment.originalName).slice(0, 240);
    const pathname = getString(attachment.pathname);
    const url = getString(attachment.url);
    const downloadUrl = getString(attachment.downloadUrl) || null;
    const contentType = getString(attachment.contentType) || null;
    const size = Number(attachment.size);
    const access =
      attachment.access === "public" || attachment.access === "private"
        ? attachment.access
        : getContactBlobAccess();

    if (!originalName || !isAllowedContactAttachmentName(originalName)) {
      throw new ContactValidationError("허용되지 않은 첨부 파일명입니다.");
    }

    if (!pathname.startsWith("contact/") || !isAllowedContactAttachmentName(pathname)) {
      throw new ContactValidationError("첨부 파일 경로가 올바르지 않습니다.");
    }

    if (!isSafeUrl(url) || (downloadUrl && !isSafeUrl(downloadUrl))) {
      throw new ContactValidationError("첨부 파일 URL이 올바르지 않습니다.");
    }

    if (!Number.isFinite(size) || size <= 0 || size > MAX_CONTACT_ATTACHMENT_SIZE) {
      throw new ContactValidationError("첨부 파일 크기가 올바르지 않습니다.");
    }

    if (contentType && !isAllowedContactAttachmentContentType(contentType)) {
      throw new ContactValidationError("허용되지 않은 첨부 파일 형식입니다.");
    }

    return {
      originalName,
      pathname,
      url,
      downloadUrl,
      contentType,
      size,
      access,
    };
  });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isSafeUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

class ContactValidationError extends Error {}
