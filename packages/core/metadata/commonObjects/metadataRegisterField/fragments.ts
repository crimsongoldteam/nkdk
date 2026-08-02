import { metadataRuleFragment } from "../metadataRuleFragment"
import { commonRegisterFieldProperties } from "./rules"

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
