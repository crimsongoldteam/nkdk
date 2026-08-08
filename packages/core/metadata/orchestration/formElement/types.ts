import { ToYAML } from "../metadataItem/registry"
import type { MetadataItemRule } from "../property/types"

//#region FormElementType

export interface FormElementTypeMap {}
export interface SingleFormElementTypeMap {}

export type CollectableElementType = keyof FormElementTypeMap & string
export type SingleElementType = keyof SingleFormElementTypeMap & string
export type ElementType = CollectableElementType | SingleElementType

export const CollectableElementTypeToYAML = {} as { [K in CollectableElementType]: FormElementTypeMap[K] }
export const CollectableElementTypeFromYAML = {} as Record<string, CollectableElementType>

export type CollectableElementToYAML<T extends CollectableElementType> = FormElementTypeMap[T]

export type CollectableElementFromYAML<D extends CollectableElementToYAML<CollectableElementType>> = {
  [K in CollectableElementType]: CollectableElementToYAML<K> extends D
    ? D extends CollectableElementToYAML<K>
      ? K
      : never
    : never
}[CollectableElementType]

export type CollectableElement = {
  itemType: CollectableElementType
  name: string
  [key: string]: any
}

//#endregion

//#region ElementRule

export interface ElementRule extends Omit<MetadataItemRule, "itemType"> {
  itemType: ElementType
  xmlTag?: string
  enterpriseField: "FormField" | "FormDecoration" | "FormTable" | "FormGroup" | "FormButton"
  enterpriseFieldType:
    | `FormFieldType.${string}`
    | `FormButtonType.${string}`
    | `FormGroupType.${string}`
    | `FormDecorationType.${string}`
    | "None"
  alwaysExportToXML?: true
}

//#endregion

//#region ElementXML

export interface ElementXMLWithoutId {
  _name: string
  [key: string]: any
}
export type ElementXML = ElementXMLWithoutId & { _id: string }

//#endregion

//#region TypedFormElement

export type TypedFormElementType = CollectableElementType

export type TypedFormElementTypeYAML = ToYAML<TypedFormElementType>

export type TypedFormElement = {
  itemType: TypedFormElementType
  name: string
  [key: string]: any
}

export type TypedFormElementYAML = ToYAML<TypedFormElementType>

//#endregion
