export type Config = Record<string, any>;

export type Logger = {
  log: (message: string) => void;
};

// Container permissions
// These are modeled as a bitfield, i.e., 0b00000110
// Allows us to mix and match permissions without
// requiring extra columns.
export enum PermissionType {
  NONE = 0,
  READ = 1 << 1,
  WRITE = 1 << 2,
  SHARE = 1 << 3,
  ADMIN = 1 << 4,
}
