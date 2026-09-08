import type { ConfigurationContextWithExportToXML, ContextElementToXML } from "@nkdk/runtime"
import { callAtomicToXML } from "../../metadata/ruleRuntime/property/fromYAMLToXML"
import type { PropertyRule } from "../../metadata/ruleRuntime"
import { xmlExport } from "@nkdk/runtime"
import { mockContextToXML } from "../mockContext"
import { readXMLFileAsString } from "../readAndParseXMLFile"
import { readXMLFixtureAsString } from "../readFixtureXML"

type Params = {
  rule: PropertyRule
  value: unknown
  xmlRootTag?: string
  exportXmlDataAsRoot?: boolean
  itemsTree?: ContextElementToXML[]
  metadataItem?: unknown
  referenceMetadata?: unknown
}

export function testAtomicToXML(params: Params & { importMetaUrl?: string; path: string }): {
  expectedResult: string
  result: string
}
export function testAtomicToXML(params: Params): { expectedResult: undefined; result: string }
export function testAtomicToXML(params: Params & { importMetaUrl?: string; path?: string }): {
  expectedResult: string | undefined
  result: string
} {
  const { rule, value, xmlRootTag, path, importMetaUrl } = params
  let expectedResult: string | undefined
  if (path !== undefined) {
    expectedResult = (importMetaUrl ? readXMLFixtureAsString(importMetaUrl, path) : readXMLFileAsString(path)).trimEnd()
  }

  const context: ConfigurationContextWithExportToXML = {
    ...mockContextToXML(),
    exportToXML: {
      ...mockContextToXML().exportToXML,
      itemsTree: params.itemsTree ?? [],
      context: { forms: [], templates: [], parentName: "" },
    },
  }
  const invocation = { context, rule, value, referenceValue: params.referenceMetadata }
  const xml = callAtomicToXML(invocation)
  const effectiveRootTag = xmlRootTag ?? (rule as { xml?: string }).xml
  const result =
    params.exportXmlDataAsRoot === true
      ? xmlExport(xml as Record<string, unknown>, false)
      : xmlExport({ [effectiveRootTag ?? "Value"]: xml }, false)
  return { expectedResult, result }
}
import { registerCommonObjects } from "../../metadata/commonObjects"

registerCommonObjects()
