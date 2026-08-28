import {
  type ConfigurationContextWithExportToXML,
} from "@nkdk/runtime"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { getParentFromContext } from "../../../context/helpers"
import { explicitElementNameStyle } from "../../explicitElementName"
import { ExtendedTooltipRules } from "../extendedTooltip/rules"
import { getExtendedTooltipName } from "../extendedTooltip/helper"
import { importSingleFormElementFromXMLToYAML } from "../ruleRuntime/fromXMLToYAML"
import { createSingletonElementYAMLToXMLNestedRule } from "../ruleRuntime/ruleFactory"
import type { ElementXML } from "../../../ruleRuntime/formElement/types"
import { getCanonicalSingletonName } from "../../../ruleRuntime/formElement/singletonName"
import { exportSingleElementRuleToJSONSchema } from "../../../ruleRuntime/formElement/toJSONSchema"

const propertyType = "PopupExtendedTooltip"
const nameStyle = explicitElementNameStyle("ExtendedTooltip", {
  canonicalSuffix: "РасширеннаяПодсказка",
  referenceSuffixes: ["РасширеннаяПодсказка", "ExtendedTooltip"],
  canonicalNameMode: "ownerSuffix",
})

export const metadataPropertyRule000 = definePropertyTypeRule(
  propertyType,
  "importFromXMLToYAML",
  ({ context, xml, ownerXmlName, traversal }) => {
    const yaml = importSingleFormElementFromXMLToYAML({
      context,
      rule: ExtendedTooltipRules,
      xml: xml as ElementXML | undefined,
      ownerXmlName,
      nameStyle,
      traversal,
    })
    return yaml === undefined || Object.keys(yaml).length === 0 ? undefined : yaml
  },
)

export const metadataPropertyRule001 = definePropertyTypeRule(
  propertyType,
  "nestedItemRule",
  { itemRule: ExtendedTooltipRules },
)

export const metadataPropertyRule002 = definePropertyTypeRule(
  propertyType,
  "nestedItemIdentity",
  {
    reserveWhenAbsent: true,
    resolveName: (ownerName) => getCanonicalSingletonName({
      ownerLogicalAddress: ownerName ?? "",
      nameStyle,
    }),
  },
)

const popupExtendedTooltipNestedRule = createSingletonElementYAMLToXMLNestedRule({
  elementRule: ExtendedTooltipRules,
  nameStyle,
  toXML: ({ context }: { context: ConfigurationContextWithExportToXML }) => ({
    name: getExtendedTooltipName(getParentFromContext(context)),
  }),
})

export const metadataPropertyRule003 = definePropertyTypeRule(
  propertyType,
  "yamlToXMLNestedRule",
  {
    ...popupExtendedTooltipNestedRule,
    normalizeYAML: ({ yaml }) => normalizePopupExtendedTooltipYAML(yaml),
    transformOutput: (params) => popupExtendedTooltipNestedRule.transformOutput?.({
      ...params,
      yaml: normalizePopupExtendedTooltipYAML(params.yaml),
    }),
  },
)

export const metadataPropertyRule004 = definePropertyTypeRule(
  propertyType,
  "exportToJSONSchema",
  ({ context }) => exportSingleElementRuleToJSONSchema({
    context,
    rule: ExtendedTooltipRules,
    explicitXMLName: true,
  }),
)

function normalizePopupExtendedTooltipYAML(yaml: unknown): unknown {
  if (typeof yaml === "object" && yaml !== null && !Array.isArray(yaml)) return yaml
  throw new Error("РасширеннаяПодсказка подменю должна быть объектом")
}
