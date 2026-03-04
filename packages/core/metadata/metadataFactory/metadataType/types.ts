import { FormElementTypeToYAML } from "~/metadata/orchestration/formElement/types"
import { createIdentityMapping, createReverseMapping, IdentityMappingType } from "../mapping"

export const SingleFormElementTypeToYAML = {
  SingleSearchControlAddition: "SingleSearchControlAddition",
  SingleSearchStringAddition: "SingleSearchStringAddition",
  AutoCommandBar: "AutoCommandBar",
  ViewStatusAddition: "ViewStatusAddition",
  ContextMenu: "ContextMenu",
  ExtendedTooltip: "ExtendedTooltip",
} as const

// #region FormElementType

export const FormElementTypeFromYAML = createReverseMapping(FormElementTypeToYAML)

export const CollectionFormElementType = createIdentityMapping(FormElementTypeToYAML)
export type CollectionFormElementType = IdentityMappingType<typeof FormElementTypeToYAML>

export const FormElementTypeYAML = createIdentityMapping(FormElementTypeFromYAML)
export type FormElementTypeYAML = IdentityMappingType<typeof FormElementTypeFromYAML>

// #endregion

// #region SingleFormElementType

export const SingleFormElementType = createIdentityMapping(SingleFormElementTypeToYAML)
export type SingleFormElementType = IdentityMappingType<typeof SingleFormElementTypeToYAML>

// #endregion

// #region AllFormElementType

export type FormElementType = CollectionFormElementType | SingleFormElementType
