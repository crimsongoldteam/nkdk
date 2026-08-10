import { describe, expect, it } from "vitest"
import type { MetadataItemRule } from "../ruleRuntime/property/types"
import { compileMetadataResourceTopology } from "./core/compiler"
import { resolveMetadataProjectChangeImpact } from "./core/xmlExportProjection"

const rule = {
  itemType: "TestObject",
  properties: {},
  metadataTargetOwner: { kind: "self", root: "Catalog" },
} as MetadataItemRule
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
        kind: "xmlDocument",
        assignmentProjectPattern: "",
        xmlPattern: "Objects/{ownerName}.xml",
        role: "metadata",
        required: true,
        prepareCapabilityId: "test",
        source,
      },
      {
        kind: "externalFile",
        assignmentProjectPattern: "",
        projectPattern: "Объект/{ownerName}/Модуль.bsl",
        xmlPattern: "Objects/{ownerName}/Ext/Module.bsl",
        direction: "both",
        transferCapabilityId: "copy",
        compositionImpact: "none",
      source,
    },
    {
      kind: "ignore",
      side: "project",
      pattern: "Служебное/{relativePath...}",
      source,
    },
  ],
  },
])

describe("metadata project change impact", () => {
  it("selects all assignment outputs for content and one edge for an external file", () => {
    expect(resolveMetadataProjectChangeImpact(topology, "Объект/Первый/Свойства.yaml")).toMatchObject({
      outputs: [expect.objectContaining({ xmlPattern: "Objects/{ownerName}.xml" })],
      externalFile: undefined,
      compositionImpact: "configurationComposition",
    })
    expect(resolveMetadataProjectChangeImpact(topology, "Объект/Первый/Модуль.bsl")).toMatchObject({
      outputs: [],
      externalFile: expect.objectContaining({ xmlPattern: "Objects/{ownerName}/Ext/Module.bsl" }),
      compositionImpact: "none",
    })
  })

  it("отличает удалённый классифицируемый путь от игнорируемого и неизвестного", () => {
    expect(resolveMetadataProjectChangeImpact(topology, "Объект/Удалённый/Свойства.yaml"))
      .toMatchObject({ assignment: expect.objectContaining({ projectPattern: "Объект/{ownerName}/Свойства.yaml" }) })
    expect(resolveMetadataProjectChangeImpact(topology, "Служебное/state.bin")).toBeUndefined()
    expect(resolveMetadataProjectChangeImpact(topology, "Неизвестно.bin")).toBeUndefined()
  })
})
