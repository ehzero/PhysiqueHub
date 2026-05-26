interface OrganizationLike {
  id?: string | null;
  name: string;
  shortName?: string | null;
}

export function getOrganizationDisplayName(organization: OrganizationLike) {
  if (organization.id === "ifbb-pro-league") {
    return "IFBB Pro (글로벌)";
  }

  return organization.name;
}
