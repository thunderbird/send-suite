export type Config = Record<string, any>;

export type Logger = {
  log: (message: string) => void;
};

// Container permissions
// These are modeled as a bitfield, i.e., 0b00000110
// Allows us to mix and match permissions without
// requiring extra database columns.
export enum PermissionType {
  NONE = 0, // 0
  READ = 1 << 1, // 2
  WRITE = 1 << 2, // 4
  SHARE = 1 << 3, // 8
  ADMIN = 1 << 4, // 16
}

function hasPermission(userPermission, pType) {
  return userPermission & pType;
}

export function hasWrite(userPermission) {
  return (
    hasPermission(userPermission, PermissionType.WRITE) ||
    hasPermission(userPermission, PermissionType.ADMIN)
  );
}

export function hasRead(userPermission) {
  return (
    hasPermission(userPermission, PermissionType.READ) ||
    hasPermission(userPermission, PermissionType.ADMIN)
  );
}

export function hasAdmin(userPermission) {
  return (
    hasPermission(userPermission, PermissionType.READ) ||
    hasPermission(userPermission, PermissionType.ADMIN)
  );
}

export function hasShare(userPermission) {
  return (
    hasPermission(userPermission, PermissionType.SHARE) ||
    hasPermission(userPermission, PermissionType.ADMIN)
  );
}
