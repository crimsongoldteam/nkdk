import { IFormNameable, IFormItemable } from "./helpers/interfaces"
import * as SystemEnumeration from "@/meta/systemEnumerations"
import { ITypeDescription } from "@/elements/interfaces"
import { IFormElement } from "@/elements/interfaces"

export type ExplicitUndefined<T> = T | undefined

export interface IManagedFormElement extends IFormElement, IFormItemable, IFormNameable {
  title: string
}

export interface IFormElementProperties {
  type?: SystemEnumeration.FormFieldType
}

export interface IFormAttribute {
  title: string
  name: string
  path: string
  storedData: boolean
  valueType: ITypeDescription
}

export interface IFormHorizontalAlignableProperties {
  horizontalAlignInGroup: SystemEnumeration.HorizontalAlign
}

export interface IFormHorizontalStretchableProperties {
  horizontalStretch: boolean | undefined
}

export interface IPicture {}

export interface IShortcut {}

export interface IColor {}

export interface IFont {}

export interface IEnterpriseTransform {
  fillTransform(element: IFormElement): void

  fillElement(element: IFormElement): void
}

export interface IPropertiesEnterpriseTransform {
  fillTransform(properties: IFormElementProperties): void

  fillProperties(properties: IFormElementProperties): void
}

export interface IXMLTransform {
  fillTransform(element: IFormElement): void
}
