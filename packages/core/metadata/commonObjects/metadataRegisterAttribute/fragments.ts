import { metadataRuleFragment } from "../metadataRuleFragment"
import { commonRegisterFieldProperties } from "../metadataRegisterField/rules"
import { stringRule } from "../string/types"

export const metadataRegisterAttributeRuleBase = {
  itemType: "MetadataRegisterAttribute",
  externalMetadata: { segment: "Attribute", placement: "ownerChild" },
} as const

export const registerAttributeIdentityFragment = metadataRuleFragment(
  ["objectBelonging", "name"],
  { objectBelonging: commonRegisterFieldProperties.objectBelonging, name: commonRegisterFieldProperties.name }
)

export const registerAttributePresentationFragment = metadataRuleFragment(
  ["synonym", "comment", "type", "passwordMode", "format", "editFormat", "toolTip", "markNegatives", "mask", "multiLine", "extendedEdit", "minValue", "maxValue"],
  { synonym: commonRegisterFieldProperties.synonym, comment: commonRegisterFieldProperties.comment, type: commonRegisterFieldProperties.type, passwordMode: commonRegisterFieldProperties.passwordMode, format: commonRegisterFieldProperties.format, editFormat: commonRegisterFieldProperties.editFormat, toolTip: commonRegisterFieldProperties.toolTip, markNegatives: commonRegisterFieldProperties.markNegatives, mask: commonRegisterFieldProperties.mask, multiLine: commonRegisterFieldProperties.multiLine, extendedEdit: commonRegisterFieldProperties.extendedEdit, minValue: commonRegisterFieldProperties.minValue, maxValue: commonRegisterFieldProperties.maxValue }
)

export const registerAttributeFillFragment = metadataRuleFragment(
  ["fillFromFillingValue", "fillValue"],
  { fillFromFillingValue: commonRegisterFieldProperties.fillFromFillingValue, fillValue: commonRegisterFieldProperties.fillValue }
)

export const registerAttributeChoiceFragment = metadataRuleFragment(
  ["fillChecking", "choiceFoldersAndItems", "choiceParameterLinks", "choiceParameters", "quickChoice", "createOnInput", "choiceForm", "linkByType", "choiceHistoryOnInput"],
  { fillChecking: commonRegisterFieldProperties.fillChecking, choiceFoldersAndItems: commonRegisterFieldProperties.choiceFoldersAndItems, choiceParameterLinks: commonRegisterFieldProperties.choiceParameterLinks, choiceParameters: commonRegisterFieldProperties.choiceParameters, quickChoice: commonRegisterFieldProperties.quickChoice, createOnInput: commonRegisterFieldProperties.createOnInput, choiceForm: commonRegisterFieldProperties.choiceForm, linkByType: commonRegisterFieldProperties.linkByType, choiceHistoryOnInput: commonRegisterFieldProperties.choiceHistoryOnInput }
)

export const registerAttributeIndexAndFullTextFragment = metadataRuleFragment(
  ["indexing", "fullTextSearch"],
  { indexing: commonRegisterFieldProperties.indexing, fullTextSearch: commonRegisterFieldProperties.fullTextSearch }
)

export const registerAttributeDataHistoryFragment = metadataRuleFragment(
  ["dataHistory"],
  { dataHistory: commonRegisterFieldProperties.dataHistory }
)

export const registerAttributeBinaryStorageUseFragment = metadataRuleFragment(
  ["binaryDataStorageLocationUse"],
  { binaryDataStorageLocationUse: commonRegisterFieldProperties.binaryDataStorageLocationUse }
)

export const registerAttributeBinaryStorageUseFieldFragment = metadataRuleFragment(
  ["binaryDataStorageLocationUseField"],
  { binaryDataStorageLocationUseField: commonRegisterFieldProperties.binaryDataStorageLocationUseField }
)

export const registerAttributeScheduleLinkFragment = metadataRuleFragment(["scheduleLink"], {
  scheduleLink: stringRule({
    yaml: "СвязьСГрафиком",
    xml: "ScheduleLink",
    xmlParents: ["Properties"],
    defaultValueXMLRaw: "",
  }),
})

export const registerAttributeUuidFragment = metadataRuleFragment(
  ["uuid"],
  { uuid: commonRegisterFieldProperties.uuid }
)
