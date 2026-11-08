import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targets = [path.join(root, 'dist')];

for (const target of targets) {
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      fs.rmSync(target, { recursive: true, force: true });
      break;
    } catch (error) {
      if (attempt === 9) {
        console.error(`failed to clean ${target}: ${error.message}`);
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
}
