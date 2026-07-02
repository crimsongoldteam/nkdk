import { ElementXML, importPropertyFromXML, PropertyRule } from "../../metadata/orchestration"
import { importContentFromXML } from "../../xml/import/importer"
import { mockContextFromXML } from "../mockContext"
import { readAndParseXMLFile } from "../readAndParseXMLFile"
import { testFixturesDir } from "../testFixturesDir"

export const testImportPropertyFromXML = (
  params: {
    rule: PropertyRule
    /**
     * Корневой тег, под которым находятся данные в XML.
     * Если не указан — весь распарсенный XML передаётся напрямую в `importPropertyFromXML`.
     */
    xmlRootTag?: string
    /** Передаётся в `mockContextFromXML({ forReference })` (по умолчанию false). */
    forReference?: boolean
  } & (
    | {
        path: string
        importMetaUrl?: string
      }
    | {
        xmlString: string
      }
  )
): unknown => {
  const { rule, xmlRootTag, forReference } = params

  const referenceXMLData =
    "xmlString" in params
      ? importContentFromXML<{ [key: string]: ElementXML }>(params.xmlString)
      : readAndParseXMLFile<{ [key: string]: ElementXML }>(
          params.path,
          params.importMetaUrl !== undefined ? testFixturesDir(params.importMetaUrl) : undefined
        )
  const referenceXML = xmlRootTag !== undefined ? referenceXMLData[xmlRootTag] : referenceXMLData

  return importPropertyFromXML({
    context: mockContextFromXML({ forReference: forReference ?? false }),
    rule,
    value: referenceXML,
  })
}
