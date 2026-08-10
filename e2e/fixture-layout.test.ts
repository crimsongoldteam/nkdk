import { readdir } from "node:fs/promises"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const fixturesRoot = resolve(import.meta.dirname, "fixtures/xml")
const componentRoots = [
  "cf",
  "cfe/all-extension",
  "cfe/control",
  "cfe/default",
] as const

describe("metadata E2E fixture layout", () => {
  it.each(componentRoots)("contains %s without Finder metadata", async (component) => {
    const files = await collectRelativeFiles(resolve(fixturesRoot, component))
    expect(files.length).toBeGreaterThan(0)
    expect(files.some((path) => path === ".DS_Store" || path.endsWith("/.DS_Store"))).toBe(false)
    expect(files).toContain("Configuration.xml")
  })
})

async function collectRelativeFiles(root: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(resolve(root, prefix), { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const relative = prefix === "" ? entry.name : `${prefix}/${entry.name}`
    if (entry.isDirectory()) files.push(...await collectRelativeFiles(root, relative))
    else if (entry.isFile()) files.push(relative)
  }
  return files.sort()
}
