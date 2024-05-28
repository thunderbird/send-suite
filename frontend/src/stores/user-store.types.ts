export type Backup = {
  backupContainerKeys: string;
  backupKeypair: string;
  backupKeystring: string;
  backupSalt: string;
};

export type UserResponse = {
  id: number;
  email: string;
  tier: string;
  createdAt?: Date;
  updatedAt?: Date;
};
