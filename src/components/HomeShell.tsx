"use client";

import { useClientToday } from "@/hooks/use-client-today";
import { HomeView } from "@/components/HomeView";
import type { HomeHubData } from "@/lib/home-hub";

interface HomeShellProps {
  data: HomeHubData;
}

export function HomeShell({ data }: HomeShellProps) {
  const today = useClientToday();
  return <HomeView data={data} today={today} />;
}
