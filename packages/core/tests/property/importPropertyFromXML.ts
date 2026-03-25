import { ElementXML, importPropertyFromXML, PropertyRule } from "~/metadata/orchestration"
import { importContentFromXML } from "~/xml/import/importer"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { testFixturesDir } from "~/tests/testFixturesDir"

export const testImportPropertyFromXML = (
  params: {
    rule: PropertyRule
    xmlRootTag: string
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
  const { rule, xmlRootTag } = params

  const referenceXMLData =
    "xmlString" in params
      ? importContentFromXML<{ [key: string]: ElementXML }>(params.xmlString)
      : readAndParseXMLFile<{ [key: string]: ElementXML }>(
          params.path,
          params.importMetaUrl !== undefined ? testFixturesDir(params.importMetaUrl) : undefined
        )
  const referenceXML = referenceXMLData[xmlRootTag]

  return importPropertyFromXML({
    context: mockContextFromXML(),
    rule,
    value: referenceXML,
  })
}
