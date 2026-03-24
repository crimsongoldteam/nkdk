import { ElementXML, importPropertyFromXML, PropertyRule } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { testFixturesDir } from "~/tests/testFixturesDir"

export const testImportPropertyFromXML = (params: {
  rule: PropertyRule
  path: string
  xmlRootTag: string

  importMetaUrl?: string
}): unknown => {
  const { rule, path, xmlRootTag, importMetaUrl } = params

  const fixturesDir = importMetaUrl !== undefined ? testFixturesDir(importMetaUrl) : undefined

  const referenceXMLData = readAndParseXMLFile<{ [key: string]: ElementXML }>(path, fixturesDir)
  const referenceXML = referenceXMLData[xmlRootTag]

  return importPropertyFromXML({
    context: mockContextFromXML(),
    rule,
    value: referenceXML,
  })
}
