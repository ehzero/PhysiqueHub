import { prisma } from "@/lib/prisma";
import { serializePublicCompetition } from "@/lib/competition-api";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const competition = await prisma.competitionSchedule.findUnique({
    where: { id: decodeURIComponent(id) },
  });

  if (!competition) {
    return Response.json(
      {
        error: {
          code: "not_found",
          message: "Competition not found.",
        },
      },
      { status: 404 },
    );
  }

  return Response.json(serializePublicCompetition(competition));
}
