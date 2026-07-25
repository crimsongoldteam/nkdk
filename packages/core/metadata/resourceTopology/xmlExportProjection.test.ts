import { describe, expect, it } from "vitest"
import type { MetadataItemRule } from "../orchestration/property/types"
import type { RegisteredProjectSpec } from "../project/projectSpecRegistry"
import { compileMetadataResourceTopology } from "./compiler"
import { classifyMetadataProjectPath } from "./projectProjection"
import {
  projectXmlExportAssignment,
  projectXmlExportOwnerChain,
} from "./xmlExportProjection"

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

  it("projects the complete owner chain from root to immediate owner", () => {
    const ownerRule = { itemType: "TestOwner", properties: {} } as MetadataItemRule
    const childRule = { itemType: "TestChild", properties: {} } as MetadataItemRule
    const nestedRule = { itemType: "TestNested", properties: {} } as MetadataItemRule
    const topology = compileMetadataResourceTopology([
      {
        dir: "Объект",
        kind: "test",
        rule: ownerRule,
        exportSchema: () => ({}) as never,
        resources: [
          {
            kind: "content",
            projectPattern: "Объект/{ownerName}/Свойства.yaml",
            role: "properties",
            required: true,
            repeatable: true,
            compositionImpact: "configurationComposition",
            itemRule: ownerRule,
            source,
          },
          {
            kind: "content",
            projectPattern: "Объект/{ownerName}/Дети/{itemName}/Свойства.yaml",
            ownerProjectPattern: "Объект/{ownerName}/Свойства.yaml",
            logicalAddressSegment: "Дочерний",
            role: "fileItem",
            required: true,
            repeatable: true,
            compositionImpact: "configurationComposition",
            itemRule: childRule,
            source,
          },
          {
            kind: "content",
            projectPattern: "Объект/{ownerName}/Дети/{itemName}/Вложенные/{nestedName}/Свойства.yaml",
            ownerProjectPattern: "Объект/{ownerName}/Дети/{itemName}/Свойства.yaml",
            logicalAddressSegment: "Вложенный",
            role: "fileItem",
            required: true,
            repeatable: true,
            compositionImpact: "configurationComposition",
            itemRule: nestedRule,
            source,
          },
        ],
      } satisfies RegisteredProjectSpec,
    ])
    const match = classifyMetadataProjectPath(
      topology,
      "Объект/Родитель/Дети/Ребёнок/Вложенные/Элемент/Свойства.yaml"
    )
    if (match?.kind !== "content") throw new Error("content match expected")

    expect(projectXmlExportOwnerChain(topology, match)).toMatchObject([
      {
        itemType: "TestOwner",
        itemName: "Родитель",
        logicalAddress: "Объект.Родитель",
      },
      {
        itemType: "TestChild",
        itemName: "Ребёнок",
        logicalAddress: "Объект.Родитель.Дочерний.Ребёнок",
      },
    ])
  })
})
