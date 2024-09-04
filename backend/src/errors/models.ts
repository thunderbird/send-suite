// These constants identify the database errors we encounter
// when making Prisma queries.
// They should be passed to `new BaseError()`.
export const CONTAINER_NOT_CREATED = 'CONTAINER_NOT_CREATED';
export const CONTAINER_NOT_FOUND = 'CONTAINER_NOT_FOUND';
export const CONTAINER_NOT_UPDATED = 'CONTAINER_NOT_UPDATED';
export const CONTAINER_NOT_DELETED = 'CONTAINER_NOT_DELETED';

export const SHARE_NOT_CREATED = 'SHARE_NOT_CREATED';
export const SHARE_NOT_FOUND = 'SHARE_NOT_FOUND';
export const SHARE_NOT_DELETED = 'SHARE_NOT_DELETED';

export const ACCESSLINK_NOT_FOUND = 'ACCESSLINK_NOT_FOUND';
export const ACCESSLINK_NOT_UPDATED = 'ACCESSLINK_NOT_UPDATED';
export const ACCESSLINK_NOT_DELETED = 'ACCESSLINK_NOT_DELETED';

export const ITEM_NOT_CREATED = 'ITEM_NOT_CREATED';
export const ITEM_NOT_FOUND = 'ITEM_NOT_FOUND';
export const ITEM_NOT_UPDATED = 'ITEM_NOT_UPDATED';
export const ITEM_NOT_DELETED = 'ITEM_NOT_DELETED';

export const UPLOAD_NOT_CREATED = 'UPLOAD_NOT_CREATED';
export const UPLOAD_NOT_FOUND = 'UPLOAD_NOT_FOUND';
export const UPLOAD_NOT_DELETED = 'UPLOAD_NOT_DELETED';
export const UPLOAD_NOT_REPORTED = 'UPLOAD_NOT_REPORTED';

export const GROUP_NOT_CREATED = 'GROUP_NOT_CREATED';
export const GROUP_NOT_FOUND = 'GROUP_NOT_FOUND';
export const GROUP_NOT_DELETED = 'GROUP_NOT_DELETED';

export const MEMBERSHIP_NOT_CREATED = 'MEMBERSHIP_NOT_CREATED';
export const MEMBERSHIP_NOT_DELETED = 'MEMBERSHIP_NOT_DELETED';

export const INVITATION_NOT_CREATED = 'INVITATION_NOT_CREATED';
export const INVITATION_NOT_FOUND = 'INVITATION_NOT_FOUND';
export const INVITATION_NOT_UPDATED = 'INVITATION_NOT_UPDATED';
export const INVITATION_NOT_DELETED = 'INVITATION_NOT_DELETED';

export const USER_NOT_CREATED = 'USER_NOT_CREATED';
export const USER_NOT_FOUND = 'USER_NOT_FOUND';
export const USER_NOT_UPDATED = 'USER_NOT_UPDATED';
export const USER_NOT_DELETED = 'USER_NOT_DELETED';

export const TAG_NOT_CREATED = 'TAG_NOT_CREATED';
export const TAG_NOT_UPDATED = 'TAG_NOT_UPDATED';
export const TAG_NOT_DELETED = 'TAG_NOT_DELETED';

export const PROFILE_NOT_CREATED = 'PROFILE_NOT_CREATED';

export const SESSION_NOT_SAVED = 'SESSION_NOT_SAVED';

export const TRANSFER_ERROR = 'TRANSFER_ERROR';

export class BaseError extends Error {
  constructor(errorType: string) {
    super(errorType);
    // Restore the prototype chain per
    // https://www.typescriptlang.org/docs/handbook/2/classes.html#extends-clauses
    Object.setPrototypeOf(this, BaseError.prototype);
  }
}
