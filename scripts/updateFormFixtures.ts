import { promises as fs } from "fs";
import * as path from "path";

const FORMS_ROOT = path.resolve(
  "/Users/nikita/git/roundTripElements/CommonForms",
);
const FIXTURES_ROOT = path.resolve(
  "/Users/nikita/git/nakidka-core/packages/core/tests/fixtures/forms",
);

async function findFormXmlFiles(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const result: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      const nested = await findFormXmlFiles(fullPath);
      result.push(...nested);
    } else if (entry.isFile() && entry.name === "Form.xml") {
      result.push(fullPath);
    }
  }

  return result;
}

function normalizeIndentation(xmlFragment: string): string {
  const lines = xmlFragment.split(/\r?\n/);
  if (lines.length === 0) return xmlFragment;

  // Убираем полностью пустые строки в начале и в конце
  while (lines.length > 0 && lines[0].trim() === "") {
    lines.shift();
  }
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }
  if (lines.length === 0) return "";

  const normalized = lines.map((line) => {
    if (line.trim() === "") return "";

    // Считаем количество ведущих табуляций
    let count = 0;
    while (count < line.length && line[count] === "\t") {
      count++;
    }

    const content = line.slice(count);
    const newIndent = Math.max(0, count - 2);
    return `${"\t".repeat(newIndent)}${content}`;
  });

  // Возвращаем без завершающего перевода строки,
  // чтобы не было последней пустой строки в файле
  return normalized.join("\n");
}

function extractFirstChildItemFragment(formXml: string): string | null {
  const childItemsStart = formXml.indexOf("<ChildItems");
  if (childItemsStart === -1) return null;

  const childItemsOpenEnd = formXml.indexOf(">", childItemsStart);
  if (childItemsOpenEnd === -1) return null;

  const childItemsClose = formXml.indexOf("</ChildItems>", childItemsOpenEnd);
  if (childItemsClose === -1) return null;

  const inner = formXml.slice(childItemsOpenEnd + 1, childItemsClose);

  // Ищем первый тег внутри ChildItems
  const firstTagMatch = inner.match(/<([A-Za-z0-9_]+)(\s|>)/);
  if (!firstTagMatch || firstTagMatch.index === undefined) return null;

  const firstTagName = firstTagMatch[1];
  const firstTagOffset = firstTagMatch.index;

  const closingTag = `</${firstTagName}>`;
  const closingIndex = inner.indexOf(closingTag, firstTagOffset);
  if (closingIndex === -1) return null;

  const rawFragment = inner.slice(
    firstTagOffset,
    closingIndex + closingTag.length,
  );

  return normalizeIndentation(rawFragment);
}

async function buildFixtureDirMap(root: string): Promise<Record<string, string>> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const map: Record<string, string> = {};

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    map[name.toLowerCase()] = path.join(root, name);
  }

  return map;
}

async function processForm(
  formPath: string,
  fixtureDirMap: Record<string, string>,
): Promise<{
  formPath: string;
  fixturePath: string | null;
  updated: boolean;
  reason?: string;
}> {
  try {
    const xml = await fs.readFile(formPath, "utf8");

    const fragment = extractFirstChildItemFragment(xml);
    if (!fragment) {
      return {
        formPath,
        fixturePath: null,
        updated: false,
        reason: "Unable to extract first child item from ChildItems",
      };
    }

    const formDirName = path.basename(path.dirname(path.dirname(formPath)));
    const key = formDirName.toLowerCase();
    const fixtureDir = fixtureDirMap[key];

    if (!fixtureDir) {
      return {
        formPath,
        fixturePath: null,
        updated: false,
        reason: `No fixture directory mapped for form dir '${formDirName}'`,
      };
    }

    const fixturePath = path.join(fixtureDir, "full.xml");

    try {
      await fs.access(fixturePath);
    } catch {
      return {
        formPath,
        fixturePath,
        updated: false,
        reason: "Fixture full.xml not found",
      };
    }

    await fs.writeFile(fixturePath, fragment, "utf8");

    return {
      formPath,
      fixturePath,
      updated: true,
    };
  } catch (e: any) {
    return {
      formPath,
      fixturePath: null,
      updated: false,
      reason: e?.message ?? String(e),
    };
  }
}

async function main() {
  const forms = await findFormXmlFiles(FORMS_ROOT);
  const fixtureDirMap = await buildFixtureDirMap(FIXTURES_ROOT);

  const results = await Promise.all(
    forms.map((formPath) => processForm(formPath, fixtureDirMap)),
  );

  const updated = results.filter((r) => r.updated);
  const skipped = results.filter((r) => !r.updated);

  // eslint-disable-next-line no-console
  console.log("Updated fixtures:", updated.length);
  updated.forEach((r) => {
    // eslint-disable-next-line no-console
    console.log("  OK:", r.formPath, "->", r.fixturePath);
  });

  if (skipped.length) {
    // eslint-disable-next-line no-console
    console.log("Skipped / problems:", skipped.length);
    skipped.forEach((r) => {
      // eslint-disable-next-line no-console
      console.log("  SKIP:", r.formPath, "-", r.reason, "fixture:", r.fixturePath);
    });
  }
}

void main();

