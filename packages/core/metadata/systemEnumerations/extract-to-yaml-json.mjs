#!/usr/bin/env node
/**
 * Извлекает все системные перечисления *ToYAML из types.ts
 * и записывает их в JSON: { "EnumName": ["Key1", "Key2", ...] }
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const typesPath = join(__dirname, "types.ts");
const outPath = join(__dirname, "systemEnumerationsToYAML.json");

const source = readFileSync(typesPath, "utf-8");
const lines = source.split("\n");

const result = {};
let currentName = null;
let currentKeys = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  const startMatch = line.match(/^export const (\w+)ToYAML = \{/);
  if (startMatch) {
    currentName = startMatch[1];
    currentKeys = [];
    continue;
  }

  if (currentName !== null) {
    if (line.match(/^\} as const/)) {
      result[currentName] = currentKeys;
      currentName = null;
      continue;
    }
    const keyMatch = line.match(/^\s*(\w+)\s*:/);
    if (keyMatch) {
      currentKeys.push(keyMatch[1]);
    }
  }
}

writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");
console.log(`Записано ${Object.keys(result).length} перечислений в ${outPath}`);
