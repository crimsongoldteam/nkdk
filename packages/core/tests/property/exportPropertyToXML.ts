import { ConfigurationContextWithExportToXML, ContextElementToXML } from "~/metadata/context/types"
import { setIdsToElements } from "~/metadata/forms/clientApplicationForm/toXML"
import { ElementXML, exportPropertyToXML, importPropertyFromXML, PropertyRule } from "~/metadata/orchestration"
import { xmlExport } from "~/xml/export/exporter"
import { mockContextFromXML, mockContextToXML } from "../mockContext"
import { readAndParseXMLFile, readXMLFileAsString } from "../readAndParseXMLFile"
import { readAndParseXMLFixture, readXMLFixtureAsString } from "../readFixtureXML"

type TestExportPropertyToXMLParamsBase = {
  rule: PropertyRule
  value: unknown
  xmlRootTag: string
  itemsTree?: ContextElementToXML[]
  applyNumberingIds?: boolean
}

export function testExportPropertyToXML(
  params: TestExportPropertyToXMLParamsBase & {
    importMetaUrl?: string
    path: string
  }
): { expectedResult: string; result: string }

export function testExportPropertyToXML(params: TestExportPropertyToXMLParamsBase): {
  expectedResult: undefined
  result: string
}

export function testExportPropertyToXML(
  params: TestExportPropertyToXMLParamsBase & {
    importMetaUrl?: string
    path?: string
  }
): { expectedResult: string | undefined; result: string } {
  const { rule, value, xmlRootTag, path, importMetaUrl } = params

  let referenceProperty: unknown | undefined

  let expectedResult: string | undefined
  if (path !== undefined) {
    expectedResult = importMetaUrl ? readXMLFixtureAsString(importMetaUrl, path) : readXMLFileAsString(path)

    const referenceXMLData = importMetaUrl
      ? readAndParseXMLFixture<{ [key: string]: ElementXML }>(importMetaUrl, path)
      : readAndParseXMLFile<{ [key: string]: ElementXML }>(path)
    const importContext = mockContextFromXML({ forReference: true })
    referenceProperty = importPropertyFromXML({
      context: importContext,
      rule: rule,
      value: referenceXMLData[xmlRootTag],
    })
  }

  const exportContext: ConfigurationContextWithExportToXML = {
    ...mockContextToXML(),
    exportToXML: {
      ...mockContextToXML().exportToXML,
      itemsTree: params.itemsTree ?? [],
      context: {
        forms: [],
        templates: [],
        parentName: "",
        metadataForNumbering: [],
      },
    },
  }

  const xmlData = exportPropertyToXML({
    context: exportContext,
    rule,
    value,
    referenceMetadata: referenceProperty,
  })

  if (params.applyNumberingIds !== false) {
    setIdsToElements(exportContext)
  }

  const result = xmlExport({ [xmlRootTag]: xmlData }, false)

  return { expectedResult, result }
}
