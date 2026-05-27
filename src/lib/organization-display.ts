interface OrganizationLike {
  id?: string | null;
  name: string;
  shortName?: string | null;
}

export function getOrganizationDisplayName(organization: OrganizationLike) {
  if (
    organization.id === "ifbb-pro-league" ||
    organization.name === "IFBB Pro League"
  ) {
    return "IFBB Pro (글로벌)";
  }

  return organization.name;
}

export function getOrganizationDisplayShortName(organization: OrganizationLike) {
  if (
    organization.id === "npc-ifbb-pro-korea" ||
    organization.shortName === "NPC/IFBB"
  ) {
    return "NPC/IFBB Pro";
  }

  if (
    organization.id === "ifbb-pro-league" ||
    organization.shortName === "IFBB Pro League"
  ) {
    return "IFBB Pro";
  }

  return organization.shortName || makeShortName(organization.name);
}

function makeShortName(name: string): string {
  return name
    .split(/\s+|\/|·/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
