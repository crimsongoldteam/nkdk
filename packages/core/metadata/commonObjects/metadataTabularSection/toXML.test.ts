import { describe, expect, it } from "vitest"
import { fullFromXML, minimalFromXML } from "./__fixtures__/data"
import { exportPropertyToXML, importPropertyFromXML } from "~/metadata/orchestration"
import { setIdsToElements } from "~/metadata/forms/clientApplicationForm/toXML"
import type { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { importContentFromXML } from "~/xml/import/importer"

const rule = { type: "MetadataTabularSections", xml: "TabularSection" } as const

const wrapperXml = (typeName: string, rowTypeName: string, parentName: string, tabularSectionName: string) => `
<TabularSection uuid="3cf6b85b-5422-44cc-bb0a-11d41703d9f5">
	<InternalInfo>
		<xr:GeneratedType name="${typeName}.${parentName}.${tabularSectionName}" category="TabularSection">
			<xr:TypeId>c899035b-0646-4fef-9c07-43ebe4ce52ec</xr:TypeId>
			<xr:ValueId>23d23619-884d-4caa-97bc-51b55f75a25d</xr:ValueId>
		</xr:GeneratedType>
		<xr:GeneratedType name="${rowTypeName}.${parentName}.${tabularSectionName}" category="TabularSectionRow">
			<xr:TypeId>d9a4875c-9b78-47d4-83fd-291fcf7c81db</xr:TypeId>
			<xr:ValueId>a09c1086-7afe-484b-95c7-aa3acd161344</xr:ValueId>
		</xr:GeneratedType>
	</InternalInfo>
	<Properties>
		<Name>${tabularSectionName}</Name>
		<Synonym/>
		<LineNumberLength>5</LineNumberLength>
	</Properties>
	<ChildObjects/>
</TabularSection>`

type GeneratedTypeXML = {
  _name: string
  _category: string
}

type ParsedTabularSectionXML = {
  TabularSection: {
    InternalInfo: {
      "xr:GeneratedType": GeneratedTypeXML[]
    }
  }
}

const exportAndReimport = (value: unknown) => {
  const exportContext = mockContextToXML()
  // exportPropertyToXML for a collection returns an array directly (since rule.xml === xmlElement in factory)
  const xmlArray = exportPropertyToXML({ context: exportContext, rule, value, referenceMetadata: undefined })
  setIdsToElements(exportContext)
  if (!xmlArray) return undefined
  const xmlString = xmlExport({ TabularSection: xmlArray }, false)
  if (!xmlString) return undefined
  const parsed = importContentFromXML<Record<string, unknown>>(xmlString)
  return importPropertyFromXML({ context: mockContextFromXML(), rule, value: parsed["TabularSection"] })
}

const createExportContextWithParent = (
  parentType: string,
  parentName: string
): ConfigurationContextWithExportToXML => {
  const context = mockContextToXML()
  context.exportToXML.itemsTree.push({
    itemType: parentType as never,
    name: parentName,
    path: `${parentType}.${parentName}`,
  })
  return context
}

const exportWrapperAndReadGeneratedTypes = (params: {
  parentType: string
  parentName: string
  rule: {
    type: "MetadataDataProcessorTabularSections" | "MetadataExchangePlanTabularSections"
    xml: "TabularSection"
  }
  rowTypeName: string
  tabularSectionTypeName: string
}) => {
  const { parentType, parentName, rule, rowTypeName, tabularSectionTypeName } = params
  const tabularSectionName = "ТабличнаяЧасть"
  const xmlString = wrapperXml(`Input${tabularSectionTypeName}`, `Input${rowTypeName}`, parentName, tabularSectionName)
  const parsed = importContentFromXML<Record<string, unknown>>(xmlString)
  const importContext = mockContextFromXML({ forReference: true })
  const value = importPropertyFromXML({ context: importContext, rule, value: parsed["TabularSection"] })
  const exportContext = createExportContextWithParent(parentType, parentName)

  const xmlArray = exportPropertyToXML({ context: exportContext, rule, value, referenceMetadata: value })
  setIdsToElements(exportContext)
  const xmlRoundTrip = xmlExport({ TabularSection: xmlArray }, false)
  expect(xmlRoundTrip).toBeDefined()
  const roundTripParsed = importContentFromXML<ParsedTabularSectionXML>(xmlRoundTrip!)

  return roundTripParsed.TabularSection.InternalInfo["xr:GeneratedType"].map((item: any) => ({
    name: item._name,
    category: item._category,
  }))
}

describe("export MetadataTabularSections to XML", () => {
  it("should export full (round-trip)", () => {
    const result = exportAndReimport(fullFromXML)
    expect(result).toEqual(fullFromXML)
  })

  it("should export minimal (round-trip)", () => {
    const result = exportAndReimport(minimalFromXML)
    expect(result).toEqual(minimalFromXML)
  })

  it("should return undefined when data is undefined", () => {
    const result = exportAndReimport(undefined)
    expect(result).toBeUndefined()
  })

  it("should round-trip DataProcessor generated type names", () => {
    const result = exportWrapperAndReadGeneratedTypes({
      parentType: "MetadataDataProcessor",
      parentName: "ОбработкаВладелец",
      rule: { type: "MetadataDataProcessorTabularSections", xml: "TabularSection" },
      tabularSectionTypeName: "DataProcessorTabularSection",
      rowTypeName: "DataProcessorTabularSectionRow",
    })

    expect(result).toEqual([
      { name: "DataProcessorTabularSection.ОбработкаВладелец.ТабличнаяЧасть", category: "TabularSection" },
      { name: "DataProcessorTabularSectionRow.ОбработкаВладелец.ТабличнаяЧасть", category: "TabularSectionRow" },
    ])
  })

  it("should round-trip ExchangePlan generated type names", () => {
    const result = exportWrapperAndReadGeneratedTypes({
      parentType: "MetadataExchangePlan",
      parentName: "ПланОбменаВладелец",
      rule: { type: "MetadataExchangePlanTabularSections", xml: "TabularSection" },
      tabularSectionTypeName: "ExchangePlanTabularSection",
      rowTypeName: "ExchangePlanTabularSectionRow",
    })

    expect(result).toEqual([
      { name: "ExchangePlanTabularSection.ПланОбменаВладелец.ТабличнаяЧасть", category: "TabularSection" },
      { name: "ExchangePlanTabularSectionRow.ПланОбменаВладелец.ТабличнаяЧасть", category: "TabularSectionRow" },
    ])
  })
})
