import { describe, expect, it } from "vitest"
import type { RegisteredProjectSpec } from "../project/projectSpecRegistry"
import type { MetadataItemRule } from "../orchestration/property/types"
import { compileMetadataResourceTopology } from "./compiler"
import { matchXmlImportResource, projectXmlImportTopology } from "./xmlImportProjection"

const rule = { itemType: "TestObject", properties: {} } as MetadataItemRule
const source = { kind: "itemRule" as const, description: "test" }

describe("XML import topology projection", () => {
  it("groups metadata, body, property XML and an external file under one assignment", () => {
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
          ...(["metadata", "body", "property"] as const).map((role) => ({
            kind: "xmlDocument" as const,
            assignmentProjectPattern: "",
            xmlPattern: `Objects/{ownerName}/${role}.xml`,
            role,
            required: true,
            read: { inputRole: role },
            prepareCapabilityId: "test",
            source,
          })),
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
        ],
      } satisfies RegisteredProjectSpec,
    ])
    const projection = projectXmlImportTopology(topology)

    expect(matchXmlImportResource(projection, "Objects/Первый/body.xml")).toEqual([
      expect.objectContaining({
        kind: "xmlDocument",
        assignment: expect.objectContaining({ projectPattern: "Объект/{ownerName}/Свойства.yaml" }),
        node: expect.objectContaining({ role: "body" }),
        values: { ownerName: "Первый" },
      }),
    ])
    expect(matchXmlImportResource(projection, "Objects/Первый/Module.bsl")).toEqual([
      expect.objectContaining({
        kind: "externalFile",
        projectPath: "Объект/Первый/Модуль.bsl",
        assignmentProjectPath: "Объект/Первый/Свойства.yaml",
      }),
    ])
  })
})
