import { describe, expect, it } from "vitest"
import type { MetadataItemRule } from "../orchestration/property/types"
import type { RegisteredProjectSpec } from "../project/projectSpecRegistry"
import { compileMetadataResourceTopology } from "./compiler"
import {
  classifyMetadataProjectPath,
  createMetadataProjectPathClassifier,
  listProjectFiles,
} from "./projectProjection"

const rule = { itemType: "TestObject", properties: {} } as MetadataItemRule
const source = { kind: "itemRule" as const, description: "test" }

const topology = compileMetadataResourceTopology([
  {
    dir: "Объект",
    kind: "test",
    rule,
    exportSchema: () => ({}) as never,
    resources: [
      {
        kind: "content",
        projectPattern: "Объект/{ownerName}/Свойства.yaml",
        role: "properties",
        required: true,
        repeatable: true,
        compositionImpact: "configurationComposition",
        itemRule: rule,
        source,
      },
      {
        kind: "externalFile",
        assignmentProjectPattern: "",
        projectPattern: "Объект/{ownerName}/Модуль.bsl",
        xmlPattern: "Objects/{ownerName}/Module.bsl",
        direction: "both",
        transferCapabilityId: "copy",
        compositionImpact: "none",
        source,
      },
      {
        kind: "ignore",
        side: "project",
        pattern: ".service/{rest...}",
        source,
      },
    ],
  } satisfies RegisteredProjectSpec,
])

describe("project resource topology projection", () => {
  it("переиспользуемый классификатор сохраняет результат точечной классификации", () => {
    const classify = createMetadataProjectPathClassifier(topology)
    for (const path of [
      "Объект/Первый/Свойства.yaml",
      "Объект/Первый/Модуль.bsl",
      ".service/cache.bin",
      "Объект/Первый/Лишний.yaml",
    ]) {
      expect(classify(path)).toEqual(classifyMetadataProjectPath(topology, path))
    }
  })

  it("читает не больше 32 каталогов параллельно", async () => {
    let active = 0
    let maxActive = 0
    const rootEntries = Array.from({ length: 40 }, (_unused, index) => directory(`dir-${index}`))

    const files = await listProjectFiles("/project", async (path) => {
      if (path === "/project") return rootEntries
      active += 1
      maxActive = Math.max(maxActive, active)
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
      active -= 1
      return [file("data.yaml")]
    })

    expect(files).toHaveLength(40)
    expect(maxActive).toBe(32)
  })

  it.each([
    ["Объект/Первый/Свойства.yaml", "content", "properties"],
    ["Объект/Первый/Модуль.bsl", "externalFile", "external"],
    [".service/cache.bin", "ignore", "external"],
  ] as const)("classifies %s", (path, kind, role) => {
    expect(classifyMetadataProjectPath(topology, path)).toMatchObject({ kind, role })
  })

  it("rejects paths outside the topology", () => {
    expect(classifyMetadataProjectPath(topology, "Объект/Первый/Лишний.yaml")).toBeUndefined()
  })
})

function directory(name: string) {
  return { name, isDirectory: () => true, isFile: () => false }
}

function file(name: string) {
  return { name, isDirectory: () => false, isFile: () => true }
}
