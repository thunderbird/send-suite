export type Config = Record<string, any>;

export type Logger = {
  log: (message: string) => void;
};

// Container permissions
// These a
export enum PermissionType {
  NONE = 0,
  READ = 1 << 1,
  WRITE = 1 << 2,
  SHARE = 1 << 3,
  ADMIN = 1 << 4,
}
