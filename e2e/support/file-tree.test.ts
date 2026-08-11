import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { compareFileTrees } from "./file-tree"

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe("compareFileTrees", () => {
  it("accepts identical paths and bytes", async () => {
    const fixture = await treeFixture()
    await write(fixture.expectedDir, "a.xml", "<Root><Value>1</Value></Root>\n")
    await write(fixture.actualDir, "a.xml", "<Root><Value>1</Value></Root>\n")

    await expect(compareFileTrees(fixture)).resolves.toEqual({
      equal: true,
      added: [],
      removed: [],
      changed: [],
    })
  })

  it("reports added, removed and byte-changed files", async () => {
    const fixture = await treeFixture()
    await write(fixture.expectedDir, "removed.txt", "old")
    await write(fixture.expectedDir, "changed.xml", "<Root><Value>1</Value></Root>\n")
    await write(fixture.actualDir, "added.txt", "new")
    await write(fixture.actualDir, "changed.xml", "<Root>\n\t<Value>1</Value>\n</Root>\n")

    const result = await compareFileTrees(fixture)

    expect(result).toMatchObject({
      equal: false,
      added: ["added.txt"],
      removed: ["removed.txt"],
      changed: ["changed.xml"],
      reportDir: fixture.reportDir,
    })
    expect(await readFile(join(fixture.reportDir, "summary.txt"), "utf8"))
      .toContain("changed.xml")
    expect(await readFile(join(fixture.reportDir, "changed.xml.diff"), "utf8"))
      .toContain("Value")
    expect(await readFile(join(fixture.reportDir, "changed.xml.normalized.diff"), "utf8"))
      .toContain("Смысловое XML-содержимое совпадает")
  })

  it("shows a normalized semantic XML difference", async () => {
    const fixture = await treeFixture()
    await write(fixture.expectedDir, "changed.xml", "<Root><Value>1</Value></Root>")
    await write(fixture.actualDir, "changed.xml", "<Root><Value>2</Value></Root>")

    await compareFileTrees(fixture)

    expect(await readFile(join(fixture.reportDir, "changed.xml.normalized.diff"), "utf8"))
      .toMatch(/[+-].*Value/u)
  })
})

async function treeFixture(): Promise<{
  expectedDir: string
  actualDir: string
  reportDir: string
}> {
  const root = await mkdtemp(join(tmpdir(), "nkdk-file-tree-test-"))
  roots.push(root)
  const expectedDir = join(root, "expected")
  const actualDir = join(root, "actual")
  const reportDir = join(root, "report")
  await Promise.all([
    mkdir(expectedDir, { recursive: true }),
    mkdir(actualDir, { recursive: true }),
  ])
  return { expectedDir, actualDir, reportDir }
}

async function write(root: string, relativePath: string, content: string): Promise<void> {
  const path = join(root, relativePath)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content)
}
