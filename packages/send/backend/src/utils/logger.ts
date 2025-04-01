/* eslint-disable @typescript-eslint/no-explicit-any */
class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private skipLogging(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  private formatMessage(message: string): string {
    return `[${this.getTimestamp()}] ${message}`;
  }

  /* When the environment is set to dev, we log info, debug and log */
  log(...args: any[]): void {
    if (this.skipLogging()) return;
    console.log(this.formatMessage(args.join(' ')));
  }
  info(...args: any[]): void {
    if (this.skipLogging()) return;
    console.info(this.formatMessage(args.join(' ')));
  }
  debug(...args: any[]): void {
    if (this.skipLogging()) return;
    console.debug(this.formatMessage(args.join(' ')));
  }

  /* We always log warns and errors */
  warn(...args: any[]): void {
    console.warn(this.formatMessage(args.join(' ')));
  }
  error(...args: any[]): void {
    console.error(this.formatMessage(args.join(' ')));
  }
}

export const logger = new Logger();
