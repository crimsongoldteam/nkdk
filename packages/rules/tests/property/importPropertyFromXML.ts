import type { PropertyRule } from "../../metadata/ruleRuntime"
import { parseXmlDocumentWithSaxes } from "@nkdk/runtime"
import { createPropertyRuleExecutor, createRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../../metadata/composition/metadataRules"
import { mockContextFromXML } from "../mockContext"
import { readXMLFileAsString } from "../readAndParseXMLFile"
import { testFixturesDir } from "../testFixturesDir"

const propertyRules = createPropertyRuleExecutor(createRuleRegistrySet(metadataRules).property)

export const testImportPropertyFromXML = (
  params: {
    rule: PropertyRule
    /**
     * Корневой тег, под которым находятся данные в XML.
     * Если не указан — передаются корневые узлы документа.
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

  const xml =
    "xmlString" in params
      ? params.xmlString
      : readXMLFileAsString(
          params.path,
          params.importMetaUrl !== undefined ? testFixturesDir(params.importMetaUrl) : undefined
        )
  const document = parseXmlDocumentWithSaxes(xml)
  const roots = xmlRootTag === undefined ? document.roots : document.roots.filter(node => node.name === xmlRootTag)
  const value = roots.length === 1 ? roots[0] : roots.length === 0 ? undefined : roots

  return propertyRules.fromXML({
    context: mockContextFromXML({ forReference: forReference ?? false }),
    rule,
    value,
  })
}
