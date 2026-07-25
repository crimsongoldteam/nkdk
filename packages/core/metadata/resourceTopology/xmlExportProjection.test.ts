import { describe, expect, it } from "vitest"
import type { MetadataItemRule } from "../orchestration/property/types"
import type { RegisteredProjectSpec } from "../project/projectSpecRegistry"
import { compileMetadataResourceTopology } from "./compiler"
import { classifyMetadataProjectPath } from "./projectProjection"
import { projectXmlExportAssignment } from "./xmlExportProjection"

const rule = { itemType: "TestObject", properties: {} } as MetadataItemRule
const source = { kind: "itemRule" as const, description: "test" }

describe("XML export topology projection", () => {
  it("expands every potential XML output of one content assignment", () => {
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
          ...(["metadata", "body"] as const).map((role) => ({
            kind: "xmlDocument" as const,
            assignmentProjectPattern: "",
            xmlPattern: `Objects/{ownerName}/${role}.xml`,
            role,
            required: true,
            prepareCapabilityId: "test",
            source,
          })),
        ],
      } satisfies RegisteredProjectSpec,
    ])
    const match = classifyMetadataProjectPath(topology, "Объект/Первый/Свойства.yaml")
    if (match?.kind !== "content") throw new Error("content match expected")

    expect(projectXmlExportAssignment(topology, match)).toMatchObject({
      nodeId: match.assignment?.id,
      itemType: "TestObject",
      itemName: "Первый",
      logicalAddress: "Объект.Первый",
      potentialOutputs: [
        { targetXmlPath: "Objects/Первый/metadata.xml", role: "metadata" },
        { targetXmlPath: "Objects/Первый/body.xml", role: "body" },
      ],
    })
  })
})
