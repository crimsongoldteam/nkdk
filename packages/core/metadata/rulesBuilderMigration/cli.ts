import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { join, relative } from "path"
import { createBuilderCatalog } from "./builderCatalog"
import { inventoryRulesSource } from "./inventory"
import { transformRulesSource } from "./transform"

const command = process.argv[2]
const root = process.cwd()
const metadataRoot = join(root, "metadata")
const catalog = createBuilderCatalog()

if (command === "inventory") {
  const items = listRulesFiles(metadataRoot).flatMap((filePath) =>
    inventoryRulesSource(relative(root, filePath), readFileSync(filePath, "utf-8"), catalog)
  )

  const byType = new Map<string, { count: number; mode: string; files: Set<string> }>()
  for (const item of items) {
    const row = byType.get(item.propertyType) ?? { count: 0, mode: item.mode, files: new Set<string>() }
    row.count += 1
    row.files.add(item.filePath)
    byType.set(item.propertyType, row)
  }

  console.log("type,count,mode,files")
  for (const [type, row] of [...byType.entries()].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))) {
    console.log(`${type},${row.count},${row.mode},${[...row.files].sort().join("|")}`)
  }
} else if (command === "apply") {
  let changedFiles = 0
  let convertedRules = 0
  const missingTypes = new Set<string>()

  for (const filePath of listRulesFiles(metadataRoot)) {
    const source = readFileSync(filePath, "utf-8")
    const result = transformRulesSource(relative(root, filePath), source, catalog)
    for (const missingType of result.missingTypes) missingTypes.add(missingType)
    if (!result.changed) continue
    writeFileSync(filePath, result.code)
    changedFiles += 1
    convertedRules += result.convertedCount
  }

  console.log(`changedFiles=${changedFiles}`)
  console.log(`convertedRules=${convertedRules}`)
  console.log(`missingTypes=${[...missingTypes].sort().join(",")}`)
} else {
  console.error("Usage: tsx metadata/rulesBuilderMigration/cli.ts inventory|apply")
  process.exit(1)
}

function listRulesFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) return listRulesFiles(fullPath)
    if (entry.isFile() && entry.name === "rules.ts") return [fullPath]
    return []
  })
}
