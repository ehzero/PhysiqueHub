const ORGANIZATION_DISPLAY_PRIORITY: Record<string, number> = {
  "NPC/IFBB Pro Korea": 10,
  AGP: 20,
  Monsterzym: 30,
  대한보디빌딩협회: 40,
  "NABBA Korea": 50,
  Musclemania: 60,
  WNGP: 70,
  MUSA: 80,
  "PCA Korea": 90,
  "NPCA Korea": 100,
  "K-Classic": 110,
  "WNBF Korea": 120,
  "INBA / PNBA": 130,
  ANBC: 140,
  "ONE CLASSIC": 150,
  "NAC Korea": 160,
  아고나스: 170,
};

export function getOrganizationPriority(organization: string): number {
  return ORGANIZATION_DISPLAY_PRIORITY[organization] ?? 1_000;
}
