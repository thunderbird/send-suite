export type Backup = {
  backupContainerKeys: string;
  backupKeypair: string;
  backupKeystring: string;
  backupSalt: string;
};

export type UserResponse = {
  id: string;
  email: string;
  tier: string;
  createdAt?: Date;
  updatedAt?: Date;
};
