import { IFormNameable, IFormItemable } from "./helpers/interfaces"
import * as SystemEnumeration from "@/meta/systemEnumerations"
import { ITypeDescription } from "@/elements/interfaces"
import { IFormElement } from "@/elements/interfaces"
import { IFormatterParams } from "@/formatter/interfaces"

export type ExplicitUndefined<T> = T | undefined

export interface IManagedFormElement extends IFormElement, IFormItemable, IFormNameable {
  title: string
}

export interface IFormElementProperties {
  // type?: SystemEnumeration.FormFieldType
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
  horizontalStretch?: boolean
}

export interface IPicture {}

export interface IShortcut {}

export interface IColor {}

// {Тип = ЭлементСтиля, }

export interface IFont {
  type: SystemEnumeration.FontType
  strikeout: boolean
  faceName: string
  ref: string
  scale: number
  italic: boolean
  underline: boolean
  bold: boolean
  size: number
}

export interface IEnterpriseTransform {
  import(element: IFormElement): void

  export(element: IFormElement): void
}

export interface IPropertiesEnterpriseTransform {
  import(properties: IFormElementProperties): void

  export(properties: IFormElementProperties): void
}

export interface IXMLTransform {
  import(element: IFormElement): void

  export(element: IFormElement): void
}

export interface IFormatter {
  render(element: IFormElement, params: IFormatterParams): string[]
}

export interface IMultilanguageString {
  [key: string]: string
}
