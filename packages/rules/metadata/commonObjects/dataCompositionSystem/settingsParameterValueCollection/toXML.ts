import { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { PropertyRule, definePropertyTypeRule } from "../../../ruleRuntime"
import type { SettingsParameterValueCollectionPropertyRule } from "@nkdk/runtime/rule-kit"
import type { ParameterValueXML } from "../parameterValue/types"
import { exportSettingsParameterValueDcscorItemsToXML, getDcscorItemExportValueForXmlParents } from "./dcscorItemsXML"
import type { SettingsParameterValueCollection, SettingsParameterValueCollectionXML } from "./types"

const exportSettingsParameterValueCollectionToXML = (
  context: ConfigurationContextWithExportToXML,
  rule: PropertyRule,
  value: SettingsParameterValueCollection | undefined,
  referenceMetadata?: SettingsParameterValueCollection | undefined
): SettingsParameterValueCollectionXML | ParameterValueXML | ParameterValueXML[] | undefined => {
  if (!value?.parameters) return undefined

  const collRule = rule as SettingsParameterValueCollectionPropertyRule
  const wrapped = exportSettingsParameterValueDcscorItemsToXML({
    context,
    ruleSet: {
      defaultItemRule: collRule.defaultItemRule,
      parameterRules: collRule.parameterRules,
    },
    parameters: value.parameters,
    referenceParameters: referenceMetadata?.parameters,
  })
  if (!wrapped) return undefined

  if (collRule.xmlParents !== undefined && collRule.xmlParents.length > 0) {
    return getDcscorItemExportValueForXmlParents(wrapped)
  }

  return wrapped
}

export const metadataPropertyRule000 = definePropertyTypeRule("SettingsParameterValueCollection", "exportToXML", exportSettingsParameterValueCollectionToXML)
