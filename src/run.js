import { execFile } from 'node:child_process';
import path from 'node:path';

export function runNodeCli(args, { cwd } = {}) {
  const script = path.resolve(path.dirname(new URL(import.meta.url).pathname), './cli.js');
  return new Promise((resolve, reject) => {
    execFile('node', [script, ...args], { cwd, env: process.env }, (err, stdout, stderr) => {
      if (err) {
        const e = new Error(stderr?.trim() || err.message);
        e.code = err.code;
        e.stdout = stdout;
        e.stderr = stderr;
        return reject(e);
      }
      resolve({ stdout, stderr });
    });
  });
}
