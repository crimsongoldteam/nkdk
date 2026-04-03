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
  /**
   * Если true — результат `exportPropertyToXML` уже является корнем документа (например `{ Parameter: [...] }`),
   * без дополнительной обёртки `{ [xmlRootTag]: xmlData }`.
   */
  exportXmlDataAsRoot?: boolean
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

  setIdsToElements(exportContext)

  const result =
    params.exportXmlDataAsRoot === true
      ? xmlExport(xmlData as Record<string, unknown>, false)
      : xmlExport({ [xmlRootTag]: xmlData }, false)

  return { expectedResult, result }
}
