/**
 * Static build: copy client/ to dist/.
 *
 * There is no bundler — the client is plain ES modules and loads D3 from a CDN
 * through an import map — so "building" is a copy. What it produces is the
 * serverless deployment: sessions fall back to IndexedDB and the dialogue uses
 * its scripted prompts. Run the Express server instead and the same files get
 * SQLite persistence and the AI Guide.
 */

import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

await rm(dist, { recursive: true, force: true })
await mkdir(dist, { recursive: true })
await cp(join(root, 'client'), dist, { recursive: true })

// Pages would otherwise run the output through Jekyll, which drops any file or
// directory whose name starts with an underscore.
await writeFile(join(dist, '.nojekyll'), '')

console.log('Built static client to dist/ — sessions will use IndexedDB, no AI Guide.')
