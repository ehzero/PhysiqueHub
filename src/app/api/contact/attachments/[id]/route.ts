import { get } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await hasAdminSession())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const attachment = await prisma.contactAttachment.findUnique({
    where: { id },
  });

  if (!attachment) {
    return new NextResponse("Not found", { status: 404 });
  }

  const access = attachment.access === "public" ? "public" : "private";
  const result = await get(attachment.pathname, {
    access,
    ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
  });

  if (!result) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (result.statusCode === 304) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: result.blob.etag,
        "Cache-Control": "private, no-cache",
      },
    });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Disposition": getAttachmentDisposition(attachment.originalName),
      "Content-Type":
        attachment.contentType || result.blob.contentType || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      ETag: result.blob.etag,
      "Cache-Control": "private, no-cache",
    },
  });
}

function getAttachmentDisposition(filename: string) {
  const encodedFilename = encodeURIComponent(filename);
  const fallbackFilename = filename.replace(/["\\\r\n]/g, "_");

  return `attachment; filename="${fallbackFilename}"; filename*=UTF-8''${encodedFilename}`;
}
