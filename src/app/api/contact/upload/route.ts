import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import {
  CONTACT_ATTACHMENT_CONTENT_TYPES,
  MAX_CONTACT_ATTACHMENT_SIZE,
  isAllowedContactAttachmentName,
} from "@/lib/contact";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  if (!blobToken || blobToken === "vercel_blob_rw_xxx") {
    return NextResponse.json(
      {
        error:
          "BLOB_READ_WRITE_TOKEN 환경변수가 설정되어 있지 않습니다.",
      },
      { status: 500 },
    );
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token: blobToken,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!isSafeContactPathname(pathname)) {
          throw new Error("허용되지 않은 첨부 파일 경로입니다.");
        }

        const payload = parseClientPayload(clientPayload);

        return {
          allowedContentTypes: [...CONTACT_ATTACHMENT_CONTENT_TYPES],
          maximumSizeInBytes: MAX_CONTACT_ATTACHMENT_SIZE,
          addRandomSuffix: true,
          allowOverwrite: false,
          tokenPayload: JSON.stringify({
            originalName: payload.originalName,
            pathname,
          }),
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "파일 업로드를 준비하지 못했어요.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function isSafeContactPathname(pathname: string) {
  return (
    pathname.startsWith("contact/") &&
    !pathname.includes("..") &&
    isAllowedContactAttachmentName(pathname)
  );
}

function parseClientPayload(payload: string | null) {
  if (!payload) {
    return { originalName: "" };
  }

  try {
    const parsed = JSON.parse(payload) as { originalName?: unknown };
    const originalName =
      typeof parsed.originalName === "string" ? parsed.originalName : "";

    return { originalName: originalName.slice(0, 240) };
  } catch {
    return { originalName: "" };
  }
}
