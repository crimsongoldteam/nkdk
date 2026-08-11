import { readdir } from "node:fs/promises"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const fixturesRoot = resolve(import.meta.dirname, "fixtures")
const componentRoots = [
  { path: "xml/cf", rootFile: "Configuration.xml" },
  { path: "xml/cfe/all-extension", rootFile: "Configuration.xml" },
  { path: "xml/cfe/control", rootFile: "Configuration.xml" },
  { path: "xml/cfe/default", rootFile: "Configuration.xml" },
  { path: "nkdk/cf", rootFile: "Конфигурация.yaml" },
  { path: "nkdk/cfe/Расширение_All", rootFile: "Конфигурация.yaml" },
  { path: "nkdk/cfe/РасширениеКонтроль", rootFile: "Конфигурация.yaml" },
  { path: "nkdk/cfe/РасширениеПоУмолчанию", rootFile: "Конфигурация.yaml" },
] as const

describe("metadata E2E fixture layout", () => {
  it.each(componentRoots)("contains $path without service metadata", async (component) => {
    const paths = await collectRelativePaths(resolve(fixturesRoot, component.path))
    expect(paths.length).toBeGreaterThan(0)
    expect(paths.some((path) => path.split("/").some((segment) =>
      segment === ".DS_Store" || segment === ".nkdk"
    ))).toBe(false)
    expect(paths).toContain(component.rootFile)
  })
})

async function collectRelativePaths(root: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(resolve(root, prefix), { withFileTypes: true })
  const paths: string[] = []
  for (const entry of entries) {
    const relative = prefix === "" ? entry.name : `${prefix}/${entry.name}`
    paths.push(relative)
    if (entry.isDirectory()) paths.push(...await collectRelativePaths(root, relative))
  }
  return paths.sort()
}
