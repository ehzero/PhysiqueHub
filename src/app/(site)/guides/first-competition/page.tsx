import { redirect } from "next/navigation";

export default function LegacyFirstCompetitionGuidePage() {
  redirect("/guide#division");
}
