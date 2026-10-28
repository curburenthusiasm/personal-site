import { cp, mkdir } from 'node:fs/promises';

await mkdir('public/data', { recursive: true });
await cp('data', 'public/data', { recursive: true });
