interface MetadataConfig {
  id?: string;
  dl?: number;
  dlimit?: number;
  pwd?: boolean | string;
  owner?: string;
  metadata?: any; // Probably needs more specific type
  auth?: any; // Probably needs more specific type
  nonce?: any; // Probably needs more specific type
}

export default class Metadata {
  public id: string;
  // public dl: number;
  public dlimit: number;
  public pwd: boolean;
  public owner: string;
  public metadata: any;
  public auth: any;
  public nonce: any;

  constructor(obj: MetadataConfig) {
    // this.dl = +obj.dl || 0;
    this.id = obj.id;
    this.dlimit = +obj.dlimit || 1;
    this.pwd = String(obj.pwd) === "true";
    this.owner = obj.owner;
    this.metadata = obj.metadata;
    this.auth = obj.auth;
    this.nonce = obj.nonce;
  }

  toObject() {
    return {
      id: this.id,
      // dl: this.dl,
      dlimit: this.dlimit,
      pwd: this.pwd,
      owner: this.owner,
      metadata: this.metadata,
      auth: this.auth,
      nonce: this.nonce,
    };
  }
}
