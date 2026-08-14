import { Type } from "typebox"

import {
  XML_ABSENT_TAG_VALUE,
  markYAMLScalarTag,
  taggedYAMLScalar,
  xmlAnomalyTagPayload,
  xmlAnomalyTagValue,
  yamlScalarTagAt,
  type ConfigurationContextWithExportToXML,
} from "@nkdk/runtime"
import { defineMetadataRules } from "../../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../../ruleRuntime/definition/testSupport"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { getParentFromContext } from "../../../context/helpers"
import { explicitElementNameStyle } from "../../explicitElementName"
import { ExtendedTooltipRules } from "../extendedTooltip/rules"
import { getExtendedTooltipName } from "../extendedTooltip/helper"
import { importSingleFormElementFromXMLToYAML } from "../ruleRuntime/fromXMLToYAML"
import { createSingletonElementYAMLToXMLNestedRule } from "../ruleRuntime/ruleFactory"
import type { ElementXML } from "../../../ruleRuntime/formElement/types"
import { getCanonicalSingletonName } from "../../../ruleRuntime/formElement/singletonName"

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
    if (yaml === undefined || Object.keys(yaml).length === 0) return undefined
    if (Object.keys(yaml).length === 1 && yamlScalarTagAt(yaml, "Имя") === "xml/name") {
      const value = yaml.Имя
      if (typeof value !== "string") throw new Error("Имя подсказки подменю должно быть строкой")
      return taggedYAMLScalar("xml/name", xmlAnomalyTagValue("xml/name", xmlAnomalyTagPayload("xml/name", value)))
    }
    return yaml
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
    normalizeYAML: ({ yaml, name }) => normalizePopupExtendedTooltipYAML(yaml, name),
    transformOutput: (params) => popupExtendedTooltipNestedRule.transformOutput?.({
      ...params,
      yaml: normalizePopupExtendedTooltipYAML(params.yaml, params.source.itemName),
    }),
  },
)

export const metadataPropertyRule004 = definePropertyTypeRule(
  propertyType,
  "exportToJSONSchema",
  ({ context }) =>
    context.exportToJSONSchema?.explicitXMLValues === true ||
    context.exportToJSONSchema?.validationPropertyRefs === true
      ? Type.String({ pattern: "^!xml/name[ \\t]+\\S.*$" })
      : Type.Never(),
)

export const popupExtendedTooltipRules = defineMetadataRules({
  ...emptyMetadataRules,
  explicitXMLProperties: {
    popupExtendedTooltipAbsent: {
      action: "omit",
      itemType: "Popup",
      propertyKey: "extendedTooltip",
      yamlValue: XML_ABSENT_TAG_VALUE,
    },
  },
})

function normalizePopupExtendedTooltipYAML(yaml: unknown, ownerName: string | undefined): unknown {
  if (typeof yaml === "object" && yaml !== null && !Array.isArray(yaml)) return yaml
  if (typeof yaml !== "string" || !yaml.startsWith("!xml/name")) {
    throw new Error("РасширеннаяПодсказка подменю допускает только !xml/absent или !xml/name")
  }
  const name = xmlAnomalyTagPayload("xml/name", yaml)
  if (name.length === 0) throw new Error("!xml/name требует непустое имя подсказки подменю")
  const canonicalName = getCanonicalSingletonName({ ownerLogicalAddress: ownerName ?? "", nameStyle })
  if (name === canonicalName) {
    throw new Error("!xml/name не требуется для канонического имени подсказки подменю")
  }
  const result: Record<string, unknown> = {
    Имя: xmlAnomalyTagValue("xml/name", name),
  }
  markYAMLScalarTag(result, "Имя", "xml/name")
  return result
}
