/**
 * Скрипт миграции фикстур элементов форм.
 *
 * Переносит данные из tests/fixtures/forms/{element}/ в
 * metadata/forms/elements/{element}/__fixtures__/
 * и обновляет все импорты в тестовых файлах.
 *
 * Запуск: npx tsx scripts/migrate-fixtures.ts
 * (из директории packages/core)
 */

import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "fs/promises"
import { join, resolve } from "path"

const ROOT = process.cwd()
const FIXTURES_SRC = join(ROOT, "tests", "fixtures", "forms")
const ELEMENTS_DST = join(ROOT, "metadata", "forms", "elements")

/**
 * Директории, которые не нужно мигрировать (общие фикстуры или не-элементы форм)
 */
const SKIP = new Set(["base", "clientApplicationForm", "commandSet", "commands", "events"])

/**
 * Уже мигрированные элементы (есть __fixtures__/) - только удалить старые
 */
const ALREADY_MIGRATED = new Set(["inputField", "contextMenu"])

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

/**
 * Обновляет import-пути в файле:
 * - ~/tests/fixtures/forms/{element}/data → ~/metadata/forms/elements/{element}/__fixtures__/data
 * - Относительные пути к metadata/forms/elements/.../__fixtures__/data → ~/metadata/forms/elements/...
 */
function updateImports(content: string): string {
  // ~/tests/fixtures/forms/{element}/data → ~/metadata/forms/elements/{element}/__fixtures__/data
  content = content.replace(
    /['"]~\/tests\/fixtures\/forms\/([^/'"]+)\/data['"]/g,
    (_match, element) => `"~/metadata/forms/elements/${element}/__fixtures__/data"`
  )

  // Относительные пути типа ../../../../metadata/forms/elements/inputField/__fixtures__/data
  // → ~/metadata/forms/elements/inputField/__fixtures__/data
  content = content.replace(
    /['"]\.\.\/+metadata\/forms\/elements\/([^'"]+)['"]/g,
    (_match, rest) => `"~/metadata/forms/elements/${rest}"`
  )

  return content
}

async function migrateElement(element: string): Promise<void> {
  const src = join(FIXTURES_SRC, element)
  const dst = join(ELEMENTS_DST, element, "__fixtures__")

  console.log(`  Migrating ${element}...`)

  await mkdir(dst, { recursive: true })

  const files = await readdir(src)
  for (const file of files) {
    const srcFile = join(src, file)
    const dstFile = join(dst, file)

    if (await exists(dstFile)) {
      console.log(`    Skipping (already exists): ${file}`)
      continue
    }

    if (file === "data.ts") {
      let content = await readFile(srcFile, "utf-8")
      content = updateImports(content)
      await writeFile(dstFile, content, "utf-8")
      console.log(`    Copied (with import updates): ${file}`)
    } else {
      await cp(srcFile, dstFile)
      console.log(`    Copied: ${file}`)
    }
  }

  await rm(src, { recursive: true })
  console.log(`    Deleted: tests/fixtures/forms/${element}/`)
}

async function deleteAlreadyMigrated(element: string): Promise<void> {
  const src = join(FIXTURES_SRC, element)
  if (await exists(src)) {
    await rm(src, { recursive: true })
    console.log(`  Deleted (already migrated): tests/fixtures/forms/${element}/`)
  }
}

/**
 * Обновляет импорты во всех тестовых файлах элементов форм
 */
async function updateTestImports(): Promise<void> {
  console.log("\nUpdating test file imports in metadata/forms/elements/...")

  const elementDirs = await readdir(ELEMENTS_DST)
  let updatedCount = 0

  for (const element of elementDirs) {
    const elementDir = join(ELEMENTS_DST, element)
    const dirStat = await stat(elementDir).catch(() => null)
    if (!dirStat?.isDirectory()) continue

    const files = await readdir(elementDir)
    for (const file of files) {
      if (!file.endsWith(".test.ts") && !file.endsWith(".ts")) continue
      if (file === "data.ts") continue

      const filePath = join(elementDir, file)
      const fileStat = await stat(filePath).catch(() => null)
      if (!fileStat?.isFile()) continue

      const original = await readFile(filePath, "utf-8")
      const updated = updateImports(original)

      if (updated !== original) {
        await writeFile(filePath, updated, "utf-8")
        console.log(`  Updated: ${element}/${file}`)
        updatedCount++
      }
    }
  }

  console.log(`Total updated: ${updatedCount} test files`)
}

async function main(): Promise<void> {
  console.log("Starting fixture migration...\n")

  const dirs = await readdir(FIXTURES_SRC)

  const toMigrate: string[] = []
  const toDelete: string[] = []
  const skipped: string[] = []

  for (const dir of dirs) {
    const dirStat = await stat(join(FIXTURES_SRC, dir))
    if (!dirStat.isDirectory()) continue

    if (SKIP.has(dir)) {
      skipped.push(dir)
    } else if (ALREADY_MIGRATED.has(dir)) {
      toDelete.push(dir)
    } else {
      toMigrate.push(dir)
    }
  }

  console.log(`Skipping: ${skipped.join(", ")}`)
  console.log(`Already migrated (delete old): ${toDelete.join(", ")}`)
  console.log(`To migrate: ${toMigrate.join(", ")}\n`)

  // 1. Мигрировать элементы
  console.log("=== Migrating elements ===")
  for (const element of toMigrate) {
    await migrateElement(element)
  }

  // 2. Удалить уже мигрированные
  console.log("\n=== Deleting already-migrated old dirs ===")
  for (const element of toDelete) {
    await deleteAlreadyMigrated(element)
  }

  // 3. Обновить импорты в тестовых файлах
  await updateTestImports()

  console.log("\nMigration complete!")
  console.log("Next step: update elements/tests/fromXML.test.ts and toXML.test.ts")
  console.log("to use __fixtures__ directory for XML path resolution.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
