import { ConfigurationContextWithExportToXML, ContextElementToXML } from "~/metadata/context/types"
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
  // applyNumberingIds?: boolean
  /**
   * Явный референс для `exportPropertyToXML`. Если ключ передан (в т.ч. `undefined`),
   * импорт референса из `path` не выполняется.
   */
  referenceMetadata?: unknown
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

    if (!("referenceMetadata" in params)) {
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
  }

  if ("referenceMetadata" in params) {
    referenceProperty = params.referenceMetadata
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

  const result = xmlExport({ [xmlRootTag]: xmlData }, false)

  return { expectedResult, result }
}
