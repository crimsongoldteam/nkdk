import { ConfigurationContext, ConfigurationContextFromXML } from "../../context/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { importMetadataItemCollectionFromXML } from "../../orchestration/metadataCollection/fromXML"
import { exportMetadataCollectionToXML } from "../../orchestration/metadataCollection/toXML"
import { importMetadataItemCollectionFromYAMLAsRecord } from "../../orchestration/metadataCollection/fromYAML"
import { exportMetadataCollectionToYAMLAsRecord } from "../../orchestration/metadataCollection/toYAML"
import { ExportToXMLFunctionNew } from "../../orchestration/property/fn"
import type { PropertyRule } from "../../orchestration/property/types"
import { StandardAttributeDescriptionRules } from "../standardAttributeDescription/rules"
import { StandardAttributeDescriptions, StandardAttributeDescriptionsYAML } from "../standardAttributeDescription/types"
import { StandardTabularSectionDescriptionRules } from "./rules"
import {
  StandardTabularSectionDescription,
  StandardTabularSectionDescriptionYAML,
  StandardTabularSectionDescriptions,
  StandardTabularSectionDescriptionsYAML,
} from "./types"

const xmlElement = "xr:StandardTabularSection"
const standardAttributeXmlElement = "xr:StandardAttribute"

registerTypeRule(
  "StandardTabularSectionDescriptions",
  "importFromXML",
  (context: ConfigurationContextFromXML, rule: PropertyRule, xml: unknown) => {
    return importMetadataItemCollectionFromXML(StandardTabularSectionDescriptionRules, xmlElement, {
      configurationIndexUidSegment: rule.configurationIndexUidSegment,
    })(context, rule, xml) as StandardTabularSectionDescriptions | undefined
  }
)

const exportStandardTabularSectionDescriptionsToXML: ExportToXMLFunctionNew = ({
  context,
  rule,
  value,
  referenceMetadata,
}) => {
  return exportMetadataCollectionToXML({
    context,
    rule,
    data: value as StandardTabularSectionDescriptions | undefined,
    referenceData: referenceMetadata as StandardTabularSectionDescriptions | undefined,
    itemRule: StandardTabularSectionDescriptionRules,
    xmlElement,
    keyField: "name",
  })
}

registerTypeRule("StandardTabularSectionDescriptions", "exportToXML", exportStandardTabularSectionDescriptionsToXML)

registerTypeRule(
  "StandardTabularSectionDescriptions",
  "importFromYAML",
  (context: ConfigurationContext, _rule: PropertyRule | undefined, value: unknown) => {
    return importMetadataItemCollectionFromYAMLAsRecord({
      context,
      itemRule: StandardTabularSectionDescriptionRules,
      yaml: value as StandardTabularSectionDescriptionsYAML | undefined,
    }) as StandardTabularSectionDescriptions | undefined
  }
)

registerTypeRule(
  "StandardTabularSectionDescriptions",
  "exportToYAML",
  (
    context: ConfigurationContext,
    _rule: PropertyRule | undefined,
    value: StandardTabularSectionDescriptions | undefined
  ) => {
    return exportMetadataCollectionToYAMLAsRecord({
      context,
      data: value?.filter(
        (item): item is StandardTabularSectionDescription & { name: string } => item.name !== undefined
      ),
      itemRule: StandardTabularSectionDescriptionRules,
      keyField: "name",
    }) as Record<string, StandardTabularSectionDescriptionYAML> | undefined
  }
)

registerTypeRule(
  "StandardTabularSectionAttributeDescriptions",
  "importFromXML",
  (context: ConfigurationContextFromXML, rule: PropertyRule, xml: unknown) => {
    return importMetadataItemCollectionFromXML(StandardAttributeDescriptionRules, standardAttributeXmlElement, {
      configurationIndexUidSegment: rule.configurationIndexUidSegment,
    })(context, rule, xml) as StandardAttributeDescriptions | undefined
  }
)

const exportStandardTabularSectionAttributeDescriptionsToXML: ExportToXMLFunctionNew = ({
  context,
  rule,
  value,
  referenceMetadata,
}) => {
  return exportMetadataCollectionToXML({
    context,
    rule,
    data: value as StandardAttributeDescriptions | undefined,
    referenceData: referenceMetadata as StandardAttributeDescriptions | undefined,
    itemRule: StandardAttributeDescriptionRules,
    xmlElement: standardAttributeXmlElement,
    keyField: "name",
  })
}

registerTypeRule(
  "StandardTabularSectionAttributeDescriptions",
  "exportToXML",
  exportStandardTabularSectionAttributeDescriptionsToXML
)

registerTypeRule(
  "StandardTabularSectionAttributeDescriptions",
  "importFromYAML",
  (context: ConfigurationContext, _rule: PropertyRule | undefined, value: unknown) => {
    return importMetadataItemCollectionFromYAMLAsRecord({
      context,
      itemRule: StandardAttributeDescriptionRules,
      yaml: value as StandardAttributeDescriptionsYAML | undefined,
    }) as StandardAttributeDescriptions | undefined
  }
)

registerTypeRule(
  "StandardTabularSectionAttributeDescriptions",
  "exportToYAML",
  (
    context: ConfigurationContext,
    _rule: PropertyRule | undefined,
    value: StandardAttributeDescriptions | undefined
  ) => {
    return exportMetadataCollectionToYAMLAsRecord({
      context,
      data: value?.filter(
        (item): item is StandardAttributeDescriptions[number] & { name: string } => item.name !== undefined
      ),
      itemRule: StandardAttributeDescriptionRules,
      keyField: "name",
    }) as StandardAttributeDescriptionsYAML | undefined
  }
)
