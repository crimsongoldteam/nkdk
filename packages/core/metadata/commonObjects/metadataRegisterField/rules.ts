import type { ConfigurationContext } from "../../context/types"
import { addDefaultLanguageNameToSynonym } from "../../helpers/synonymHelpers"
import type { PropertyRule } from "../../orchestration/property/types"
import {
  attributeChoiceFragment,
  attributeFillFragment,
  attributeIdentityFragment,
  attributePresentationFragment,
  attributeSearchAndHistoryFragment,
} from "../metadataAttribute/fragments"
import { uuidPropertyRule } from "../uuid/rule"

const propertiesParents = ["Properties"]
const emptySynonym = { items: {} }
const presentation = attributePresentationFragment({}).properties

export const commonRegisterFieldProperties = {
  uuid: uuidPropertyRule,
  ...attributeIdentityFragment.properties,
  ...presentation,
  synonym: {
    yaml: "Синоним",
    xml: "Synonym",
    type: "I8nText",
    excludeIfEqualNameYAML: true,
    defaultValue: ({
      context,
      yaml,
      name,
      operation,
    }: {
      context: ConfigurationContext
      yaml?: unknown
      name?: string
      operation?: string
    }) =>
      operation === "importFromYAML" &&
      name &&
      yaml !== null &&
      typeof yaml === "object" &&
      !Array.isArray(yaml)
        ? addDefaultLanguageNameToSynonym(context, undefined, name)
        : emptySynonym,
    defaultValueXMLEmpty: emptySynonym,
    xmlParents: propertiesParents,
    defaultValueXMLRaw: "",
    preserveEmptyXML: true,
  },
  type: {
    yaml: "Тип",
    type: "TypeDescription",
    xml: "Type",
    xmlParents: propertiesParents,
  },
  ...attributeFillFragment.properties,
  ...attributeChoiceFragment.properties,
  ...attributeSearchAndHistoryFragment.properties,
  binaryDataStorageLocationUse: {
    yaml: "ИспользованиеХраненияВХранилищеДвоичныхДанных",
    xml: "BinaryDataStorageLocationUse",
    type: "SystemEnumeration",
    typeSE: "BinaryDataStorageLocationUse",
    xmlParents: propertiesParents,
    noImplicitValueYAML: true,
  },
  binaryDataStorageLocationUseField: {
    yaml: "ПолеИспользованияХраненияВХранилищеДвоичныхДанных",
    xml: "BinaryDataStorageLocationUseField",
    type: "string",
    xmlParents: propertiesParents,
  },
  extendedConfigurationObject: {
    xml: "ExtendedConfigurationObject",
    type: "string",
    xmlParents: propertiesParents,
    runtimeOnly: true,
  },
} as const satisfies Record<string, PropertyRule>
