import type { User as NextAuthUser } from "next-auth";

export type UserType = NextAuthUser & {
  id?: string;
  userName?: string;
  email?: string | null;
  name?: string | null;
  password?: string;
  shortName?: string;
  phone?: string;
  emailEvara?: string;
  emailPrivate?: string;
};

export type UserPermission = {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  isActive?: boolean;
  module?: {
    id: number;
    nameAr: string;
    nameEn: string;
    code?: string | null;
    descriptionAr?: string | null;
    descriptionEn?: string | null;
    isActive?: boolean;
  };
};

export type UserRole = {
  id: number;
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  code?: string | null;
  isSystemRole?: boolean;
  levelOneId?: number | null;
  levelTwoId?: number | null;
  levelThreeId?: number | null;
  permissions?: UserPermission[];
};

export type User = {
  id: number;
  username: string;
  email?: string | null;
  password?: string;
  shortName?: string;
  phone?: string;
  emailEvara?: string;
  emailPrivate?: string;
  imageUrl?: string;
  roles?: UserRole[];
};
// export interface UserFormValues {
//   id: number;
//   username: string;
//   email?: string;
//   firstName?: string;
//   lastName?: string;
//   password?: string;
//   shortName?: string;
//   phone?: string;
//   emailEvara?: string;
//   emailPrivate?: string;
//   roles: string[];
// }
