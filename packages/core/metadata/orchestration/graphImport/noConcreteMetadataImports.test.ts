import { readdirSync, readFileSync, statSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"

const UNIVERSAL_GRAPH_IMPORT_DIR = join(process.cwd(), "metadata/orchestration/graphImport")

describe("orchestration graphImport universal core", () => {
  it("не импортирует конкретные appliedObjects/forms", () => {
    const offenders = listTypeScriptFiles(UNIVERSAL_GRAPH_IMPORT_DIR)
      .map((filePath) => ({
        filePath,
        content: readFileSync(filePath, "utf-8"),
      }))
      .filter(({ content }) =>
        content.includes("~/metadata/appliedObjects/") ||
        content.includes("~/metadata/forms/") ||
        content.includes("../../appliedObjects/") ||
        content.includes("../../forms/"),
      )
      .map(({ filePath }) => filePath.replace(`${process.cwd()}/`, ""))

    expect(offenders).toEqual([])
  })
})

function listTypeScriptFiles(dir: string): string[] {
  const result: string[] = []
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      result.push(...listTypeScriptFiles(fullPath))
      continue
    }
    if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) {
      result.push(fullPath)
    }
  }
  return result
}
