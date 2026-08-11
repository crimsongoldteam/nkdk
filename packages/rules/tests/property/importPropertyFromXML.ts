import type { ElementXML, PropertyRule } from "../../metadata/ruleRuntime"
import { importContentFromXML } from "@nkdk/runtime"
import { createPropertyRuleExecutor, createRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../../metadata/composition/metadataRules"
import { mockContextFromXML } from "../mockContext"
import { readAndParseXMLFile } from "../readAndParseXMLFile"
import { testFixturesDir } from "../testFixturesDir"

const propertyRules = createPropertyRuleExecutor(createRuleRegistrySet(metadataRules).property)

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

  return propertyRules.fromXML({
    context: mockContextFromXML({ forReference: forReference ?? false }),
    rule,
    value: referenceXML,
  })
}
