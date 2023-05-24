import { Transform } from "stream";

export default class Limiter extends Transform {
  private length: number;
  private limit: number;

  constructor(limit: number) {
    super();
    this.limit = limit;
    this.length = 0;
  }

  _transform(
    chunk: string,
    encoding: string,
    callback: (arg0?: Error) => void
  ) {
    this.length += chunk.length;
    this.push(chunk);
    if (this.length > this.limit) {
      console.error("LIMIT", this.length, this.limit);
      return callback(new Error("limit"));
    }
    callback();
  }
}
