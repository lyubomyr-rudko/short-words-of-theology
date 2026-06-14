#!/usr/bin/env node

import { access, mkdir, readFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { basename, dirname, extname, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const usage = `Usage:
  npm run marp:pptx -- <slides.md> [output.pptx] [-- <marp options>]
  node scripts/export-marp-pptx.mjs <slides.md> [output.pptx] [-- <marp options>]

Examples:
  npm run marp:pptx -- lesson-53-on-valuing-our-neibour.slides.md
  npm run marp:pptx -- lesson-53-on-valuing-our-neibour.slides.md exports/lesson-53.pptx

Options:
  -h, --help       Show this help message

Environment:
  MARP_BIN         Optional path/name for the Marp CLI binary
  MARP_NODE        Optional Node binary to run MARP_BIN with
`;

const rawArgs = process.argv.slice(2);
const separatorIndex = rawArgs.indexOf('--');
const args = separatorIndex === -1 ? rawArgs : rawArgs.slice(0, separatorIndex);
const passthroughArgs = separatorIndex === -1 ? [] : rawArgs.slice(separatorIndex + 1);

if (args.includes('-h') || args.includes('--help')) {
  process.stdout.write(usage);
  process.exit(0);
}

if (args.length < 1 || args.length > 2) {
  fail('Expected an input file and optional output file.');
}

const inputPath = resolve(args[0]);
const outputPath = resolve(args[1] ?? defaultOutputPath(inputPath));

await assertReadableFile(inputPath);
await assertMarpDeck(inputPath);
await mkdir(dirname(outputPath), { recursive: true });

const marpArgs = [
  inputPath,
  '--pptx',
  '--allow-local-files',
  '--output',
  outputPath,
  ...passthroughArgs,
];

const localMarp = resolve('node_modules/.bin/marp');
const command = await resolveMarpCommand(localMarp, marpArgs);

process.stdout.write(`Exporting ${basename(inputPath)} -> ${outputPath}\n`);
await run(command.bin, command.args);
process.stdout.write(`Done: ${outputPath}\n`);

function defaultOutputPath(filePath) {
  const extension = extname(filePath);
  const baseName = extension ? filePath.slice(0, -extension.length) : filePath;
  return `${baseName}.pptx`;
}

async function assertReadableFile(filePath) {
  try {
    await access(filePath, fsConstants.R_OK);
  } catch {
    fail(`Input file is not readable: ${filePath}`);
  }
}

async function assertMarpDeck(filePath) {
  const content = await readFile(filePath, 'utf8');

  if (!content.includes('marp: true')) {
    fail(`Input file does not look like a Marp deck: ${filePath}`);
  }
}

async function canExecute(filePath) {
  try {
    await access(filePath, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function resolveMarpCommand(localMarp, marpArgs) {
  if (process.env.MARP_BIN) {
    return process.env.MARP_NODE
      ? { bin: process.env.MARP_NODE, args: [process.env.MARP_BIN, ...marpArgs] }
      : { bin: process.env.MARP_BIN, args: marpArgs };
  }

  if (await canExecute(localMarp)) {
    return { bin: localMarp, args: marpArgs };
  }

  if (await canRunCommand('marp', ['--version'])) {
    return { bin: 'marp', args: marpArgs };
  }

  const marpPath = await findCommand('marp');
  if (marpPath) {
    const siblingNode = resolve(dirname(marpPath), 'node');

    if (await canExecute(siblingNode) && await canRunCommand(siblingNode, [marpPath, '--version'])) {
      return { bin: siblingNode, args: [marpPath, ...marpArgs] };
    }
  }

  return { bin: 'npx', args: ['-y', '@marp-team/marp-cli', ...marpArgs] };
}

function findCommand(bin) {
  return new Promise((resolveFind) => {
    const child = spawn('which', [bin], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'ignore'],
      env: process.env,
    });

    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.on('error', () => resolveFind(null));
    child.on('close', (code) => {
      resolveFind(code === 0 ? output.trim().split('\n')[0] : null);
    });
  });
}

function canRunCommand(bin, commandArgs) {
  return new Promise((resolveCheck) => {
    const child = spawn(bin, commandArgs, {
      cwd: process.cwd(),
      stdio: 'ignore',
      env: process.env,
    });

    child.on('error', () => resolveCheck(false));
    child.on('close', (code) => resolveCheck(code === 0));
  });
}

function run(bin, commandArgs) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(bin, commandArgs, {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
    });

    child.on('error', (error) => {
      rejectRun(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolveRun();
        return;
      }

      rejectRun(new Error(`${bin} exited with code ${code}`));
    });
  }).catch((error) => {
    if (bin === 'npx') {
      fail(`Marp export failed. Install Marp CLI with "npm install --save-dev @marp-team/marp-cli" or check npx/network access.\n${error.message}`);
    }

    fail(`Marp export failed.\n${error.message}`);
  });
}

function fail(message) {
  process.stderr.write(`${message}\n\n${usage}`);
  process.exit(1);
}
