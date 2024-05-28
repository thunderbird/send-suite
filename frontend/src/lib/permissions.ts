// TODO: find a way to dynamically sync with backend/src/types/custom.ts

const NONE = 0;
const READ = 1 << 1;
const WRITE = 1 << 2;
const SHARE = 1 << 3;
const ADMIN = 1 << 4;

export const PermissionsMap = {
  NONE,
  READ,
  WRITE,
  SHARE,
  ADMIN,
};

// translation
export const PermissionsDescriptions = {
  NONE: 'No Access',
  READ: 'Can view',
  WRITE: 'Can edit',
  SHARE: 'Can share',
  ADMIN: 'Admin',
};

// Look up a description, given a numeric Permission
export const PermissionsTable = {
  [NONE]: PermissionsDescriptions['NONE'],
  [READ]: PermissionsDescriptions['READ'],
  [WRITE]: PermissionsDescriptions['WRITE'],
  [SHARE]: PermissionsDescriptions['SHARE'],
  [ADMIN]: PermissionsDescriptions['ADMIN'],
};
