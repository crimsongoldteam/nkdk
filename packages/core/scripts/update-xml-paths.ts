/**
 * Обновляет пути к XML-файлам в тестах элементов форм.
 *
 * После миграции фикстур в __fixtures__/ нужно заменить:
 * - readAndParseXMLFile("forms/{element}/{file}") → readAndParseXMLFixture(import.meta.url, "{file}")
 * - testExportElementToXML({ path: "forms/{element}/{file}" }) → path: "{file}", baseDir: testFixturesDir(...)
 * - testExportPropertyToXML({ path: "forms/{element}/{file}" }) → path: "{file}", importMetaUrl: import.meta.url
 * - testImportPropertyFromXML({ path: "forms/{element}/{file}" }) → path: "{file}", importMetaUrl: import.meta.url
 * - readXMLFileAsString("forms/{element}/{file}") → readXMLFixtureAsString(import.meta.url, "{file}")
 *
 * Запуск: npx tsx scripts/update-xml-paths.ts
 */

import { readdir, readFile, stat, writeFile } from "fs/promises"
import { join } from "path"

const ROOT = process.cwd()
const ELEMENTS_DIR = join(ROOT, "metadata", "forms", "elements")

/**
 * Заменяет "forms/{element}/{filename}" → "{filename}" в строке с учётом кавычек
 */
function extractFilename(xmlPath: string): string {
  return xmlPath.replace(/^forms\/[^/]+\//, "")
}

function updateFileContent(content: string): string {
  let updated = content

  // 1. readAndParseXMLFile<T>("forms/...") → readAndParseXMLFixture<T>(import.meta.url, "...")
  updated = updated.replace(
    /readAndParseXMLFile(<[^>]*>)?\("forms\/[^/]+\/([^"]+)"\)/g,
    (_match, generic, filename) =>
      `readAndParseXMLFixture${generic ?? ""}(import.meta.url, "${filename}")`
  )

  // 2. readXMLFileAsString("forms/...") → readXMLFixtureAsString(import.meta.url, "...")
  updated = updated.replace(
    /readXMLFileAsString\("forms\/[^/]+\/([^"]+)"\)/g,
    (_match, filename) => `readXMLFixtureAsString(import.meta.url, "${filename}")`
  )

  // 3. testExportElementToXML({ element: ..., path: "forms/.../{file}" })
  //    → testExportElementToXML({ element: ..., path: "{file}", baseDir: testFixturesDir(import.meta.url) })
  updated = updated.replace(
    /testExportElementToXML\(\{([\s\S]*?)path:\s*"forms\/[^/]+\/([^"]+)"([\s\S]*?)\}\)/g,
    (_match, before, filename, after) =>
      `testExportElementToXML({${before}path: "${filename}", baseDir: testFixturesDir(import.meta.url)${after}})`
  )

  // 4. testExportPropertyToXML({ ..., path: "forms/.../{file}" }) — без importMetaUrl
  //    → добавить importMetaUrl: import.meta.url, и заменить path на имя файла
  updated = updated.replace(
    /testExportPropertyToXML\(\{([\s\S]*?)path:\s*"forms\/[^/]+\/([^"]+)"([\s\S]*?)\}\)/g,
    (_match, before, filename, after) => {
      if (before.includes("importMetaUrl") || after.includes("importMetaUrl")) {
        return _match
      }
      return `testExportPropertyToXML({${before}path: "${filename}",\n      importMetaUrl: import.meta.url${after}})`
    }
  )

  // 5. testImportPropertyFromXML({ ..., path: "forms/.../{file}" }) — без importMetaUrl
  //    → добавить importMetaUrl: import.meta.url, и заменить path на имя файла
  updated = updated.replace(
    /testImportPropertyFromXML\(\{([\s\S]*?)path:\s*"forms\/[^/]+\/([^"]+)"([\s\S]*?)\}\)/g,
    (_match, before, filename, after) => {
      if (before.includes("importMetaUrl") || after.includes("importMetaUrl")) {
        return _match
      }
      return `testImportPropertyFromXML({${before}path: "${filename}",\n      importMetaUrl: import.meta.url${after}})`
    }
  )

  // 6. Обновить импорты
  updated = updateImports(updated)

  return updated
}

function updateImports(content: string): string {
  // Добавить readAndParseXMLFixture в импорт из readFixtureXML если ещё нет
  const usesReadAndParseXMLFixture = content.includes("readAndParseXMLFixture(")
  const usesReadXMLFixtureAsString = content.includes("readXMLFixtureAsString(")
  const usesTestFixturesDir = content.includes("testFixturesDir(")

  // Если уже есть импорт из readFixtureXML, дополнить его
  if (usesReadAndParseXMLFixture || usesReadXMLFixtureAsString) {
    const hasReadFixtureXMLImport = content.includes('"~/tests/readFixtureXML"')
    if (!hasReadFixtureXMLImport) {
      const newImports: string[] = []
      if (usesReadAndParseXMLFixture) newImports.push("readAndParseXMLFixture")
      if (usesReadXMLFixtureAsString) newImports.push("readXMLFixtureAsString")

      // Добавить после последнего import
      const lastImportIdx = content.lastIndexOf("\nimport ")
      const insertAfter = content.indexOf("\n", lastImportIdx + 1)
      content =
        content.slice(0, insertAfter + 1) +
        `import { ${newImports.join(", ")} } from "~/tests/readFixtureXML"\n` +
        content.slice(insertAfter + 1)
    } else {
      // Дополнить существующий импорт если нужных символов нет
      if (usesReadAndParseXMLFixture && !content.includes("readAndParseXMLFixture")) {
        content = content.replace(
          /import \{([^}]+)\} from "~\/tests\/readFixtureXML"/,
          (_m, existing) => `import {${existing}, readAndParseXMLFixture } from "~/tests/readFixtureXML"`
        )
      }
      if (usesReadXMLFixtureAsString && !content.includes("readXMLFixtureAsString")) {
        content = content.replace(
          /import \{([^}]+)\} from "~\/tests\/readFixtureXML"/,
          (_m, existing) => `import {${existing}, readXMLFixtureAsString } from "~/tests/readFixtureXML"`
        )
      }
    }
  }

  // Добавить testFixturesDir импорт если используется
  if (usesTestFixturesDir && !content.includes('"~/tests/testFixturesDir"')) {
    const lastImportIdx = content.lastIndexOf("\nimport ")
    const insertAfter = content.indexOf("\n", lastImportIdx + 1)
    content =
      content.slice(0, insertAfter + 1) +
      `import { testFixturesDir } from "~/tests/testFixturesDir"\n` +
      content.slice(insertAfter + 1)
  }

  // Убрать readAndParseXMLFile из импорта если больше не используется
  if (!content.includes("readAndParseXMLFile(") && content.includes("readAndParseXMLFile")) {
    // remove from import
    content = content.replace(
      /import \{([^}]*)\breadAndParseXMLFile\b([^}]*)\} from "~\/tests\/readAndParseXMLFile"/,
      (_m, before, after) => {
        const remaining = `${before}${after}`.replace(/,\s*,/g, ",").replace(/^\s*,\s*|\s*,\s*$/g, "").trim()
        if (!remaining) {
          return ""
        }
        return `import { ${remaining} } from "~/tests/readAndParseXMLFile"`
      }
    )
    // clean up empty lines
    content = content.replace(/\n\n\n/g, "\n\n")
  }

  // Убрать readXMLFileAsString из импорта если больше не используется
  if (!content.includes("readXMLFileAsString(") && content.includes("readXMLFileAsString")) {
    content = content.replace(
      /import \{([^}]*)\breadXMLFileAsString\b([^}]*)\} from "~\/tests\/readAndParseXMLFile"/,
      (_m, before, after) => {
        const remaining = `${before}${after}`.replace(/,\s*,/g, ",").replace(/^\s*,\s*|\s*,\s*$/g, "").trim()
        if (!remaining) {
          return ""
        }
        return `import { ${remaining} } from "~/tests/readAndParseXMLFile"`
      }
    )
    content = content.replace(/\n\n\n/g, "\n\n")
  }

  return content
}

async function processFile(filePath: string): Promise<boolean> {
  const original = await readFile(filePath, "utf-8")
  if (!original.includes("forms/")) return false

  const updated = updateFileContent(original)
  if (updated === original) return false

  await writeFile(filePath, updated, "utf-8")
  return true
}

async function processDir(dir: string): Promise<number> {
  let count = 0
  const entries = await readdir(dir)
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const s = await stat(fullPath)
    if (s.isDirectory()) {
      count += await processDir(fullPath)
    } else if (entry.endsWith(".test.ts") || entry.endsWith(".ts")) {
      const changed = await processFile(fullPath)
      if (changed) {
        console.log(`  Updated: ${fullPath.replace(ROOT + "/", "")}`)
        count++
      }
    }
  }
  return count
}

async function main() {
  console.log("Updating XML paths in element test files...\n")
  const count = await processDir(ELEMENTS_DIR)
  console.log(`\nTotal updated: ${count} files`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
