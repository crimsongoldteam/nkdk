import fs from "node:fs"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { mockContextToXML } from "../../tests/mockContext"
import { configurationIndexPath } from "../configurationIndex/fileIO"
import { syncConfigurationToXml } from "./syncConfiguration"
import { createTempRoot, removeFullSyncTempDirs, writeSmallYamlProjectWithIndex } from "./testHelpers"

afterEach(async () => {
  await removeFullSyncTempDirs()
})

describe("full XML sync determinism", () => {
  it("writes byte-identical XML and index for equal projects", async () => {
    const root = createTempRoot()
    const projectOne = join(root, "project-one")
    const projectTwo = join(root, "project-two")
    const outOne = join(root, "out-one")
    const outTwo = join(root, "out-two")
    await writeSmallYamlProjectWithIndex(projectOne)
    fs.cpSync(
      join(projectOne, "Бот", "БотВсеСвойства"),
      join(projectOne, "Бот", "ВторойБот"),
      { recursive: true }
    )
    fs.cpSync(projectOne, projectTwo, { recursive: true })

    const first = await syncConfigurationToXml({
      context: mockContextToXML(),
      yamlDir: projectOne,
      xmlDir: outOne,
      concurrency: 1,
    })
    const second = await syncConfigurationToXml({
      context: mockContextToXML(),
      yamlDir: projectTwo,
      xmlDir: outTwo,
      concurrency: 2,
    })

    expect(first.failed).toEqual([])
    expect(second.failed).toEqual([])
    expect(readTree(outTwo)).toEqual(readTree(outOne))
    expect(fs.readFileSync(configurationIndexPath(projectTwo))).toEqual(fs.readFileSync(configurationIndexPath(projectOne)))
  })
})

function readTree(root: string): Record<string, Buffer> {
  const result: Record<string, Buffer> = {}
  for (const path of listFiles(root)) result[path] = fs.readFileSync(join(root, ...path.split("/")))
  return result
}

function listFiles(root: string): string[] {
  const result: string[] = []
  const stack = [""]
  while (stack.length > 0) {
    const relativeDir = stack.pop()!
    const absoluteDir = relativeDir === "" ? root : join(root, ...relativeDir.split("/"))
    for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
      const path = relativeDir === "" ? entry.name : `${relativeDir}/${entry.name}`
      if (entry.isDirectory()) stack.push(path)
      else if (entry.isFile()) result.push(path)
    }
  }
  return result.sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)))
}
