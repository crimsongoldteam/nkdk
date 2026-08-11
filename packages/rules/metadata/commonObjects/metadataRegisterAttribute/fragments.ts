import {
  metadataRuleFragment,
  stringProperty,
} from "../metadataRuleFragment"
import {
  registerFieldBinaryStorageUseFieldFragment,
  registerFieldBinaryStorageUseFragment,
  registerFieldChoiceFragment,
  registerFieldDataHistoryFragment,
  registerFieldFillFragment,
  registerFieldIdentityFragment,
  registerFieldIndexAndFullTextFragment,
  registerFieldPresentationFragment,
  registerFieldUuidFragment,
} from "../metadataRegisterField/fragments"

export const metadataRegisterAttributeRuleBase = {
  itemType: "MetadataRegisterAttribute",
  externalMetadata: { segment: "Attribute", placement: "ownerChild" },
} as const

export const registerAttributeIdentityFragment = registerFieldIdentityFragment
export const registerAttributePresentationFragment = registerFieldPresentationFragment
export const registerAttributeFillFragment = registerFieldFillFragment
export const registerAttributeChoiceFragment = registerFieldChoiceFragment
export const registerAttributeIndexAndFullTextFragment = registerFieldIndexAndFullTextFragment
export const registerAttributeDataHistoryFragment = registerFieldDataHistoryFragment
export const registerAttributeBinaryStorageUseFragment = registerFieldBinaryStorageUseFragment
export const registerAttributeBinaryStorageUseFieldFragment = registerFieldBinaryStorageUseFieldFragment

export const registerAttributeScheduleLinkFragment = metadataRuleFragment(["scheduleLink"], {
  scheduleLink: stringProperty({
    yaml: "СвязьСГрафиком",
    xml: "ScheduleLink",
    xmlParents: ["Properties"],
    defaultValueXMLRaw: "",
  }),
})

export const registerAttributeUuidFragment = registerFieldUuidFragment
