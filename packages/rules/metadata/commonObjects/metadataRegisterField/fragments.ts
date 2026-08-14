import { splitPascalCase } from "../../helpers/canConvertToPascalCase"
import {
  attributeChoiceFragment,
  attributeFillFragment,
  attributeIdentityFragment,
  attributePresentationFragment,
  attributeSearchAndHistoryFragment,
} from "../metadataAttribute/fragments"
import {
  type MetadataRulePropertyShape,
  metadataRuleFragment,
} from "../metadataRuleFragment"

const propertiesParents = ["Properties"]
const emptySynonym = { items: {} }
const presentation = attributePresentationFragment({}).properties

export const commonRegisterFieldProperties = {
  uuid: {
    type: "uuid",
    xml: "_uuid",
    evaluateWhenYAMLMissing: true,
    forReferenceOnly: true,
    toYAML: false,
    fromYAML: false,
  },
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
      context: { defaultLanguage: string }
      yaml?: unknown
      name?: string
      operation?: string
    }) =>
      operation === "importFromYAML" &&
      name &&
      yaml !== null &&
      typeof yaml === "object" &&
      !Array.isArray(yaml)
        ? { items: { [context.defaultLanguage]: splitPascalCase(name) } }
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
} as const satisfies Record<string, MetadataRulePropertyShape>

export const registerFieldIdentityFragment = metadataRuleFragment(
  ["objectBelonging", "name"],
  {
    objectBelonging: commonRegisterFieldProperties.objectBelonging,
    name: commonRegisterFieldProperties.name,
  }
)

export const registerFieldPresentationFragment = metadataRuleFragment(
  [
    "synonym",
    "comment",
    "type",
    "passwordMode",
    "format",
    "editFormat",
    "toolTip",
    "markNegatives",
    "mask",
    "multiLine",
    "extendedEdit",
    "minValue",
    "maxValue",
  ],
  {
    synonym: commonRegisterFieldProperties.synonym,
    comment: commonRegisterFieldProperties.comment,
    type: commonRegisterFieldProperties.type,
    passwordMode: commonRegisterFieldProperties.passwordMode,
    format: commonRegisterFieldProperties.format,
    editFormat: commonRegisterFieldProperties.editFormat,
    toolTip: commonRegisterFieldProperties.toolTip,
    markNegatives: commonRegisterFieldProperties.markNegatives,
    mask: commonRegisterFieldProperties.mask,
    multiLine: commonRegisterFieldProperties.multiLine,
    extendedEdit: commonRegisterFieldProperties.extendedEdit,
    minValue: commonRegisterFieldProperties.minValue,
    maxValue: commonRegisterFieldProperties.maxValue,
  }
)

export const registerFieldFillFragment = metadataRuleFragment(
  ["fillFromFillingValue", "fillValue"],
  {
    fillFromFillingValue: commonRegisterFieldProperties.fillFromFillingValue,
    fillValue: commonRegisterFieldProperties.fillValue,
  }
)

export const registerFieldChoiceFragment = metadataRuleFragment(
  [
    "fillChecking",
    "choiceFoldersAndItems",
    "choiceParameterLinks",
    "choiceParameters",
    "quickChoice",
    "createOnInput",
    "choiceForm",
    "linkByType",
    "choiceHistoryOnInput",
  ],
  {
    fillChecking: commonRegisterFieldProperties.fillChecking,
    choiceFoldersAndItems: commonRegisterFieldProperties.choiceFoldersAndItems,
    choiceParameterLinks: commonRegisterFieldProperties.choiceParameterLinks,
    choiceParameters: commonRegisterFieldProperties.choiceParameters,
    quickChoice: commonRegisterFieldProperties.quickChoice,
    createOnInput: commonRegisterFieldProperties.createOnInput,
    choiceForm: commonRegisterFieldProperties.choiceForm,
    linkByType: commonRegisterFieldProperties.linkByType,
    choiceHistoryOnInput: commonRegisterFieldProperties.choiceHistoryOnInput,
  }
)

export const registerFieldIndexAndFullTextFragment = metadataRuleFragment(
  ["indexing", "fullTextSearch"],
  {
    indexing: commonRegisterFieldProperties.indexing,
    fullTextSearch: commonRegisterFieldProperties.fullTextSearch,
  }
)

export const registerFieldFullTextFragment = metadataRuleFragment(["fullTextSearch"], {
  fullTextSearch: commonRegisterFieldProperties.fullTextSearch,
})

export const registerFieldDataHistoryFragment = metadataRuleFragment(["dataHistory"], {
  dataHistory: commonRegisterFieldProperties.dataHistory,
})

export const registerFieldBinaryStorageUseFragment = metadataRuleFragment(
  ["binaryDataStorageLocationUse"],
  { binaryDataStorageLocationUse: commonRegisterFieldProperties.binaryDataStorageLocationUse }
)

export const registerFieldBinaryStorageUseFieldFragment = metadataRuleFragment(
  ["binaryDataStorageLocationUseField"],
  { binaryDataStorageLocationUseField: commonRegisterFieldProperties.binaryDataStorageLocationUseField }
)

export const registerFieldUuidFragment = metadataRuleFragment(["uuid"], {
  uuid: commonRegisterFieldProperties.uuid,
})
