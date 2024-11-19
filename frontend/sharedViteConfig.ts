import fs from 'fs';
import path from 'path';
import { UserConfig } from 'vite';

export const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, './package.json'), 'utf8')
);

console.log('using packageJson:', packageJson);

export const sharedViteConfig: UserConfig = {
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
};
