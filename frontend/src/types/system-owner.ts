export type SystemOwnerStatus = "active" | "suspended";

export type SystemOwner = {
  id: number;
  name: string;
  slug: string;
  status: SystemOwnerStatus;
};

export type SystemOwnerStatusFilter = "all" | SystemOwnerStatus;

export const systemOwnerStatusOptions: SystemOwnerStatusFilter[] = [
  "all",
  "active",
  "suspended",
];
