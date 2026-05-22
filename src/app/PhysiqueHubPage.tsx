import { connection } from "next/server";
import PhysiqueHubApp, { type AppRoute } from "./PhysiqueHubApp";

interface PhysiqueHubPageProps {
  initialRoute: AppRoute;
}

export async function PhysiqueHubPage({ initialRoute }: PhysiqueHubPageProps) {
  await connection();

  return (
    <PhysiqueHubApp
      key={initialRoute}
      initialRoute={initialRoute}
      initialToday={getKoreaDateParam()}
    />
  );
}

function getKoreaDateParam(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}
