import fs from "node:fs"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { mockContextToXML } from "../../tests/mockContext"
import { readConfigurationIndex } from "../configurationIndex"
import type { ConfigurationIndexData } from "../configurationIndex/types"
import { syncConfigurationToXml } from "./syncConfiguration"
import { createTempRoot, removeFullSyncTempDirs, writeSmallYamlProjectWithIndex } from "./testHelpers"

afterEach(async () => {
  await removeFullSyncTempDirs()
})

describe("full XML sync determinism", () => {
  it("writes byte-identical XML and a semantically deterministic index for equal projects", async () => {
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
    expect(normalizeIndex(await readConfigurationIndex({ projectDir: projectTwo }))).toEqual(
      normalizeIndex(await readConfigurationIndex({ projectDir: projectOne }))
    )
  })
})

function readTree(root: string): Record<string, Buffer> {
  const result: Record<string, Buffer> = {}
  for (const path of listFiles(root)) result[path] = fs.readFileSync(join(root, ...path.split("/")))
  return result
}

function normalizeIndex(index: ConfigurationIndexData): ConfigurationIndexData {
  const compare = (left: string, right: string) => Buffer.compare(Buffer.from(left), Buffer.from(right))
  return {
    ...index,
    projectFiles: [...index.projectFiles].sort((left, right) => compare(left.projectPath, right.projectPath)),
    identities: [...index.identities].sort((left, right) =>
      compare(`${left.logicalAddress}\0${left.kind}`, `${right.logicalAddress}\0${right.kind}`)
    ),
    xmlNodes: [...index.xmlNodes].sort((left, right) => compare(left.logicalAddress, right.logicalAddress)),
    xmlValues: [...index.xmlValues].sort((left, right) => compare(left.logicalAddress, right.logicalAddress)),
  }
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
