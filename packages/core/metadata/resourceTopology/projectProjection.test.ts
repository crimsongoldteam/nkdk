import { describe, expect, it } from "vitest"
import type { MetadataItemRule } from "../orchestration/property/types"
import type { RegisteredProjectSpec } from "../project/projectSpecRegistry"
import { compileMetadataResourceTopology } from "./compiler"
import { classifyMetadataProjectPath } from "./projectProjection"

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
