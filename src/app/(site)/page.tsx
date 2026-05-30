import { HomeShell } from "@/components/HomeShell";
import { getHomeHubData } from "@/lib/home-hub";

export const revalidate = 86_400;

export default async function Home() {
  const data = await getHomeHubData();
  return <HomeShell data={data} />;
}
