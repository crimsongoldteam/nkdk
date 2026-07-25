import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockContextToXML } from "../../../tests/mockContext"
import { withConfigurationIndexCollector } from "../../configurationIndex/collector/context"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { xmlExport } from "../../../xml/export/exporter"
import { importContentFromXML } from "../../../xml/import/importer"
import { createLocalIndexesCollector } from "../../project/localIndexes"
import { importPropertiesFromXMLToYAML } from "../../orchestration/property/fromXMLToYAML"
import { MetadataItemRule, PropertyRule } from "../../orchestration"
import { importInternalInfoFromXML } from "./fromXML"
import { exportInternalInfoToXML } from "./toXML"
import { InternalInfoRootXML } from "./types"

const rule: PropertyRule = {
  type: "InternalInfo",
  forReferenceOnly: true,
  items: [{ name: "ExchangePlanRef", category: "Ref" }],
}

const containedObjectsRule: PropertyRule = {
  type: "InternalInfo",
  forReferenceOnly: true,
}

const generatedContainedObjectsRule: PropertyRule = {
  type: "InternalInfo",
  forReferenceOnly: true,
  containedObjectClassIds: ["00000000-0000-0000-0000-000000000101", "00000000-0000-0000-0000-000000000102"],
}

const ruleWithThisNode: PropertyRule = { ...rule, thisNode: true }

const xml = `
<InternalInfo>
	<xr:GeneratedType name="ExchangePlanRef" category="Ref">
		<xr:TypeId>00000000-0000-0000-0000-000000000001</xr:TypeId>
		<xr:ValueId>00000000-0000-0000-0000-000000000003</xr:ValueId>
	</xr:GeneratedType>
	<xr:ThisNode>00000000-0000-0000-0000-000000000002</xr:ThisNode>
</InternalInfo>`

const xmlWithContainedObject = `
<InternalInfo>
	<xr:GeneratedType name="ExchangePlanRef.Товары" category="Ref">
		<xr:TypeId>00000000-0000-0000-0000-000000000001</xr:TypeId>
		<xr:ValueId>00000000-0000-0000-0000-000000000003</xr:ValueId>
	</xr:GeneratedType>
	<xr:ThisNode>00000000-0000-0000-0000-000000000002</xr:ThisNode>
	<xr:ContainedObject>
		<xr:ClassId>00000000-0000-0000-0000-000000000101</xr:ClassId>
		<xr:ObjectId>00000000-0000-0000-0000-000000000201</xr:ObjectId>
	</xr:ContainedObject>
</InternalInfo>`

const importFixture = () => {
  const parsed = importContentFromXML<{ InternalInfo: InternalInfoRootXML }>(xml)
  return importInternalInfoFromXML(mockContextFromXML({ forReference: true }), rule, parsed.InternalInfo)
}

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__")

const importContainedObjectsFixture = () => {
  const source = readFileSync(join(fixturesDir, "containedObjects.xml"), "utf8")
  const parsed = importContentFromXML<{ InternalInfo: InternalInfoRootXML }>(source)
  return importInternalInfoFromXML(
    mockContextFromXML({ forReference: true }),
    containedObjectsRule,
    parsed.InternalInfo
  )
}

describe("importInternalInfoFromXML", () => {
  it("collects every InternalInfo UUID without exposing InternalInfo in YAML", () => {
    const parsed = importContentFromXML<{ InternalInfo: InternalInfoRootXML }>(xmlWithContainedObject)
    const indexCollector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(mockContextFromXML(), indexCollector, "Справочник.Товары")

    const yaml = importPropertiesFromXMLToYAML({
      context,
      rule: {
        itemType: "TestInternalInfoItem",
        properties: {
          internalInfo: {
            ...rule,
            xml: "InternalInfo",
          },
        },
      } as MetadataItemRule,
      sources: [{ context, xml: parsed }],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(yaml).toEqual({})
    expect(indexCollector.fragment("Справочник/Товары/Свойства.yaml").identities).toEqual([
      {
        logicalAddress: "Справочник.Товары.InternalInfo.GeneratedType.ExchangePlanRef.TypeId",
        kind: "uuid",
        value: "00000000-0000-0000-0000-000000000001",
      },
      {
        logicalAddress: "Справочник.Товары.InternalInfo.GeneratedType.ExchangePlanRef.ValueId",
        kind: "uuid",
        value: "00000000-0000-0000-0000-000000000003",
      },
      {
        logicalAddress: "Справочник.Товары.InternalInfo.ThisNode",
        kind: "uuid",
        value: "00000000-0000-0000-0000-000000000002",
      },
      {
        logicalAddress:
          "Справочник.Товары.InternalInfo.ContainedObject.00000000-0000-0000-0000-000000000101.ObjectId",
        kind: "uuid",
        value: "00000000-0000-0000-0000-000000000201",
      },
    ])
  })

  it("imports GeneratedType and ThisNode", () => {
    expect(importFixture()).toEqual({
      ExchangePlanRef: {
        typeId: "00000000-0000-0000-0000-000000000001",
        valueId: "00000000-0000-0000-0000-000000000003",
      },
      thisNode: "00000000-0000-0000-0000-000000000002",
    })
  })

  it("round-trips ThisNode with GeneratedType", () => {
    const imported = importFixture()
    const exported = exportInternalInfoToXML({
      context: mockContextToXML(),
      rule: ruleWithThisNode,
      value: imported,
      referenceMetadata: imported,
      metadataItem: { itemType: "MetadataExchangePlan" as never },
    })
    const exportedXML = xmlExport({ InternalInfo: exported }, false)
    const reparsed = importContentFromXML<{ InternalInfo: InternalInfoRootXML }>(exportedXML)

    expect(importInternalInfoFromXML(mockContextFromXML({ forReference: true }), rule, reparsed.InternalInfo)).toEqual(
      imported
    )
  })

  it("imports ContainedObject items", () => {
    expect(importContainedObjectsFixture()).toEqual({
      containedObjects: [
        {
          classId: "00000000-0000-0000-0000-000000000101",
          objectId: "00000000-0000-0000-0000-000000000201",
        },
        {
          classId: "00000000-0000-0000-0000-000000000102",
          objectId: "00000000-0000-0000-0000-000000000202",
        },
      ],
    })
  })

  it("round-trips ContainedObject items from model data", () => {
    const imported = importContainedObjectsFixture()
    const exported = exportInternalInfoToXML({
      context: mockContextToXML(),
      rule: containedObjectsRule,
      value: imported,
      referenceMetadata: undefined,
      metadataItem: { itemType: "MetadataConfiguration" as never },
    })
    const exportedXML = xmlExport({ InternalInfo: exported }, false)
    const reparsed = importContentFromXML<{ InternalInfo: InternalInfoRootXML }>(exportedXML)

    expect(
      importInternalInfoFromXML(mockContextFromXML({ forReference: true }), containedObjectsRule, reparsed.InternalInfo)
    ).toEqual(imported)
  })

  it("generates declared ContainedObject items without model or reference data", () => {
    const exported = exportInternalInfoToXML({
      context: mockContextToXML(),
      rule: generatedContainedObjectsRule,
      value: undefined,
      referenceMetadata: undefined,
      metadataItem: { itemType: "MetadataConfiguration" as never },
    })

    expect(exported["xr:ContainedObject"]).toEqual([
      {
        "xr:ClassId": "00000000-0000-0000-0000-000000000101",
        "xr:ObjectId": "11111111-1111-4111-8111-111111111111",
      },
      {
        "xr:ClassId": "00000000-0000-0000-0000-000000000102",
        "xr:ObjectId": "11111111-1111-4111-8111-111111111111",
      },
    ])
  })

  it("uses existing ContainedObject ObjectId for declared ClassId", () => {
    const imported = importContainedObjectsFixture()
    const exported = exportInternalInfoToXML({
      context: mockContextToXML(),
      rule: generatedContainedObjectsRule,
      value: undefined,
      referenceMetadata: imported,
      metadataItem: { itemType: "MetadataConfiguration" as never },
    })

    expect(exported["xr:ContainedObject"]).toEqual([
      {
        "xr:ClassId": "00000000-0000-0000-0000-000000000101",
        "xr:ObjectId": "00000000-0000-0000-0000-000000000201",
      },
      {
        "xr:ClassId": "00000000-0000-0000-0000-000000000102",
        "xr:ObjectId": "00000000-0000-0000-0000-000000000202",
      },
    ])
  })

  it("prefers reference ThisNode when exporting", () => {
    const exported = exportInternalInfoToXML({
      context: mockContextToXML(),
      rule: ruleWithThisNode,
      value: {
        ExchangePlanRef: {
          typeId: "00000000-0000-0000-0000-000000000001",
          valueId: "00000000-0000-0000-0000-000000000003",
        },
        thisNode: "new",
      },
      referenceMetadata: {
        ExchangePlanRef: {
          typeId: "00000000-0000-0000-0000-000000000001",
          valueId: "00000000-0000-0000-0000-000000000003",
        },
        thisNode: "ref",
      },
      metadataItem: { itemType: "MetadataExchangePlan" as never },
    })

    expect(exported["xr:ThisNode"]).toBe("ref")
  })

  it("generates ThisNode when rule opts in and no model or reference value exists", () => {
    const exported = exportInternalInfoToXML({
      context: mockContextToXML(),
      rule: ruleWithThisNode,
      value: {
        ExchangePlanRef: {
          typeId: "00000000-0000-0000-0000-000000000001",
          valueId: "00000000-0000-0000-0000-000000000003",
        },
      },
      referenceMetadata: undefined,
      metadataItem: { itemType: "MetadataExchangePlan" as never },
    })

    expect(exported["xr:ThisNode"]).toBe("11111111-1111-4111-8111-111111111111")
  })

  it("does not export ThisNode without rule opt-in", () => {
    const exported = exportInternalInfoToXML({
      context: mockContextToXML(),
      rule,
      value: {
        ExchangePlanRef: {
          typeId: "00000000-0000-0000-0000-000000000001",
          valueId: "00000000-0000-0000-0000-000000000003",
        },
        thisNode: "new",
      },
      referenceMetadata: {
        ExchangePlanRef: {
          typeId: "00000000-0000-0000-0000-000000000001",
          valueId: "00000000-0000-0000-0000-000000000003",
        },
        thisNode: "ref",
      },
      metadataItem: { itemType: "MetadataExchangePlan" as never },
    })

    expect(exported).not.toHaveProperty("xr:ThisNode")
  })
})
