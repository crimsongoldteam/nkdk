import { definePropertyTypeRule } from "../../ruleRuntime/property/propertyRuleRegistrySet"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { ConfigurationContext } from "@nkdk/runtime"
import { exportMetadataValueToXML } from "../metadataValue/toXML"
import { MetadataPrimitiveValueXML } from "../metadataValue/types"
import type {
  ChoiceParameterLink,
  ChoiceParameterLinks,
  ChoiceParameterLinksXML,
  ChoiceParameterLinkXML,
} from "./types"

export const exportChoiceParameterLinkToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  link: ChoiceParameterLink
): ChoiceParameterLinkXML => {
  const dataPath = exportMetadataValueToXML({
    context,
    rule: { type: "MetadataValue", valueType: "string" } as any,
    value: { type: "string", value: link.dataPath },
  })! as MetadataPrimitiveValueXML

  return {
    "xr:Name": link.name,
    "xr:DataPath": dataPath,
    "xr:ValueChange": link.valueChange,
  }
}

export const exportChoiceParameterLinksToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  links: ChoiceParameterLinks | undefined
): ChoiceParameterLinksXML | undefined => {
  if (!links || links.length === 0) return undefined

  return {
    "xr:Link": links.map((link) => exportChoiceParameterLinkToXML(context, undefined, link)),
  }
}

export const metadataPropertyRule000 = definePropertyTypeRule("ChoiceParameterLinks", "exportToXML", exportChoiceParameterLinksToXML)
