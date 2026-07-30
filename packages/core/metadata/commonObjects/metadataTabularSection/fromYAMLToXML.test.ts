import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  serializeDirectXML,
  testPropertyFixtureThroughYAML,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import { mockContextToXML } from "../../../tests/mockContext"
import { importContentFromXML } from "../../../xml/import/importer"
import type { MetadataItemRule } from "../../orchestration/property/types"

import "./register"

const INLINE_XML = `<TabularSection uuid="3cf6b85b-5422-44cc-bb0a-11d41703d9f5"><Properties><Name>Исполнители</Name><Synonym/><Comment/><ToolTip/><FillChecking>DontCheck</FillChecking><Use>ForItem</Use><LineNumberLength>5</LineNumberLength></Properties><ChildObjects/></TabularSection>`

describe("MetadataTabularSections YAML → XML", () => {
  it("should export full (round-trip)", () => expectFixtureRoundTrip("full.xml"))

  it("should export minimal (round-trip)", () => expectFixtureRoundTrip("minimal.xml"))

  it("preserves explicit empty Synonym as empty XML tag", () => {
    const rule = probeRule("MetadataTabularSections")
    const referenceXML = importContentFromXML<Record<string, unknown>>(INLINE_XML)
    const contexts = createDirectRoundTripContexts()
    const yaml = testPropertyFromXMLToYAML({ rule, xml: referenceXML, context: contexts.importContext }).yaml
    const result = serializeDirectXML(
      testPropertyFromYAMLToXML({ rule, yaml, referenceXML, context: contexts.exportContext() }).xml
    )
    expect(result).toContain("<Synonym/>")
    expect(result).not.toContain("<v8:content>Исполнители</v8:content>")
  })

  it("should return undefined when data is undefined", () => {
    expect(testPropertyFromYAMLToXML({ rule: probeRule("MetadataTabularSections"), yaml: {} }).xml).toEqual({})
  })

  it("should round-trip DataProcessor generated type names", () => {
    expectGeneratedTypes({
      parentType: "MetadataDataProcessor",
      parentName: "ОбработкаВладелец",
      propertyType: "MetadataDataProcessorTabularSections",
      expectedType: "DataProcessorTabularSection",
      expectedRowType: "DataProcessorTabularSectionRow",
    })
  })

  it("should round-trip ExchangePlan generated type names", () => {
    expectGeneratedTypes({
      parentType: "MetadataExchangePlan",
      parentName: "ПланОбменаВладелец",
      propertyType: "MetadataExchangePlanTabularSections",
      expectedType: "ExchangePlanTabularSection",
      expectedRowType: "ExchangePlanTabularSectionRow",
    })
  })

  it("should return undefined when data is undefined after YAML export", () => {
    expect(testPropertyFromYAMLToXML({ rule: probeRule("MetadataTabularSections"), yaml: {} }).xml).toEqual({})
  })
})

function expectFixtureRoundTrip(fixture: string): void {
  const result = testPropertyFixtureThroughYAML({
    propertyType: "MetadataTabularSections",
    xmlRootTag: "TabularSection",
    importMetaUrl: import.meta.url,
    fixture,
    itemsTree: [
      {
        itemType: "MetadataCatalog",
        name: "СправочникВладелец",
        path: "MetadataCatalog.СправочникВладелец",
      },
    ],
  })
  expect(normalize(result.result)).toBe(normalize(result.expected))
}

function expectGeneratedTypes(params: {
  parentType: string
  parentName: string
  propertyType: string
  expectedType: string
  expectedRowType: string
}): void {
  const sectionName = "ТабличнаяЧасть"
  const xml = importContentFromXML<Record<string, unknown>>(
    wrapperXML(`Input${params.expectedType}`, `Input${params.expectedRowType}`, params.parentName, sectionName)
  )
  const rule = probeRule(params.propertyType)
  const contexts = createDirectRoundTripContexts()
  const yaml = testPropertyFromXMLToYAML({ rule, xml, context: contexts.importContext }).yaml
  const base = mockContextToXML()
  base.exportToXML.itemsTree.push({
    itemType: params.parentType as never,
    name: params.parentName,
    path: `${params.parentType}.${params.parentName}`,
  })
  const result = serializeDirectXML(
    testPropertyFromYAMLToXML({ rule, yaml, referenceXML: xml, context: contexts.exportContext(base) }).xml
  )
  expect(result).toContain(`name="${params.expectedType}.${params.parentName}.${sectionName}" category="TabularSection"`)
  expect(result).toContain(
    `name="${params.expectedRowType}.${params.parentName}.${sectionName}" category="TabularSectionRow"`
  )
}

function probeRule(type: string): MetadataItemRule {
  return {
    itemType: `${type}Probe`,
    properties: { value: { type, yaml: "Значение", xml: "TabularSection" } },
  } as MetadataItemRule
}

const wrapperXML = (typeName: string, rowTypeName: string, parentName: string, sectionName: string): string => `
<TabularSection uuid="3cf6b85b-5422-44cc-bb0a-11d41703d9f5">
  <InternalInfo>
    <xr:GeneratedType name="${typeName}.${parentName}.${sectionName}" category="TabularSection"><xr:TypeId>c899035b-0646-4fef-9c07-43ebe4ce52ec</xr:TypeId><xr:ValueId>23d23619-884d-4caa-97bc-51b55f75a25d</xr:ValueId></xr:GeneratedType>
    <xr:GeneratedType name="${rowTypeName}.${parentName}.${sectionName}" category="TabularSectionRow"><xr:TypeId>d9a4875c-9b78-47d4-83fd-291fcf7c81db</xr:TypeId><xr:ValueId>a09c1086-7afe-484b-95c7-aa3acd161344</xr:ValueId></xr:GeneratedType>
  </InternalInfo>
  <Properties><Name>${sectionName}</Name><Synonym/><LineNumberLength>5</LineNumberLength></Properties><ChildObjects/>
</TabularSection>`

const normalize = (value: string): string => value.replace(/^\ufeff?<\?xml[^\n]*\?>\r?\n?/, "").replace(/\r\n/g, "\n").trimEnd()
