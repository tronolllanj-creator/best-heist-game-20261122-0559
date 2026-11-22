import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Resolve the absolute path to the file containing this script.
const scriptDir = fileURLToPath(new URL('.', import.meta.url));

// Determine where the final package should be written.
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Ensure the output root exists before placing anything inside it.
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

// Always copy the game module into the build folder.
const gameSrc = join(scriptDir, 'game');
const gameDst = join(outDir, 'game');
cpSync(gameSrc, gameDst, { recursive: true });

// Screenshots are optional; only copy the folder when it is actually present.
const shotSrc = join(scriptDir, 'screenshots');
const shotDst = join(outDir, 'screenshots');

if (existsSync(shotSrc)) {
  if (!existsSync(shotDst)) {
    mkdirSync(shotDst, { recursive: true });
  }
  cpSync(shotSrc, shotDst, { recursive: true });
}

// Capture the output directory as the canonical base for the dossier scan.
const dossierSource = outDir;

// Define hard caps for file sizes, counts, and screenshot limits.
const buildLimits = {
  text_max_bytes: 163840,
  screenshots: {
    max: 4,
    max_bytes: 262144,
  },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

// Generate the metadata manifest from the staged files and caps.
const finalDossier = buildDossier(dossierSource, buildLimits);

// Serialize the manifest to the expected JSON location.
const dossierPath = join(outDir, 'dossier.json');
writeFileSync(dossierPath, JSON.stringify(finalDossier, null, 2));

// Console feedback confirming the entry point finished its work.
console.log(`Main build complete. Dossier written to ${dossierPath}`);
