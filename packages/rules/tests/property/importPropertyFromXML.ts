import type { PropertyRule } from "../../metadata/ruleRuntime"
import { createPropertyRuleExecutor, createRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../../metadata/composition/metadataRules"
import { mockContextFromXML } from "../mockContext"
import { readPropertyXML } from "../structuralXML"

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

  const value = readPropertyXML({ ...params, xmlRootTag })

  return propertyRules.fromXML({
    context: mockContextFromXML({ forReference: forReference ?? false }),
    rule,
    value,
  })
}
