export const roles = ["sme", "buyer", "funder"] as const;
export type Role = (typeof roles)[number];

export interface SessionUser {
  id: string;
  name: string;
  organization: string;
  role: Role;
}
