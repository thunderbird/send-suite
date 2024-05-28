export enum UserTier {
  FREE = 1,
  EPHEMERAL,
  PRO,
}

export class User {
  id: number;
  tier: UserTier;
  email: string;

  constructor() {
    this.id = 0;
    this.tier = UserTier.FREE;
    this.email = '';
  }
}
