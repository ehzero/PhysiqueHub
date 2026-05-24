import { HomeShell } from "@/components/HomeShell";
import { getHomeHubData } from "@/lib/home-hub";

export const revalidate = 21_600;

export default async function Home() {
  const data = await getHomeHubData();
  return <HomeShell data={data} />;
}
