import { describe, expect, it } from "vitest"
import type { MetadataItemRule } from "../orchestration/property/types"
import { compileMetadataResourceTopology } from "./compiler"
import { resolveMetadataProjectChangeImpact } from "./xmlExportProjection"

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
})
