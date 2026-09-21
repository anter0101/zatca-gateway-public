import type { SystemOwner } from "@/types/system-owner";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

let nextId = 6;

let systemOwners: SystemOwner[] = [
  { id: 1, name: "Evara POS", slug: "evara-pos", status: "active" },
  { id: 2, name: "Riyadh ERP", slug: "riyadh-erp", status: "active" },
  { id: 3, name: "Najd Soft", slug: "najd-soft", status: "suspended" },
  { id: 4, name: "Gulf Retail Suite", slug: "gulf-retail-suite", status: "active" },
  { id: 5, name: "Hijaz Commerce", slug: "hijaz-commerce", status: "active" },
];

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export async function listSystemOwners(): Promise<SystemOwner[]> {
  await delay();
  return [...systemOwners];
}

export async function createSystemOwner(input: {
  name: string;
  slug?: string;
  status: SystemOwner["status"];
}): Promise<SystemOwner> {
  await delay();
  const owner: SystemOwner = {
    id: nextId++,
    name: input.name,
    slug: input.slug?.trim() || slugify(input.name),
    status: input.status,
  };
  systemOwners = [owner, ...systemOwners];
  return owner;
}

export async function updateSystemOwner(
  id: number,
  input: {
    name: string;
    slug?: string;
    status: SystemOwner["status"];
  },
): Promise<SystemOwner> {
  await delay();
  const index = systemOwners.findIndex((owner) => owner.id === id);
  if (index === -1) {
    throw new Error("System owner not found");
  }
  const updated: SystemOwner = {
    ...systemOwners[index],
    name: input.name,
    slug: input.slug?.trim() || slugify(input.name),
    status: input.status,
  };
  systemOwners = [
    ...systemOwners.slice(0, index),
    updated,
    ...systemOwners.slice(index + 1),
  ];
  return updated;
}

export async function removeSystemOwner(id: number): Promise<void> {
  await delay();
  systemOwners = systemOwners.filter((owner) => owner.id !== id);
}
