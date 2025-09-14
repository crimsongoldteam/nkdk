import { IFormAttributeable, IFormNameable, IFormItemable, IFormAttributeableProperties } from "./helpers/interfaces"
import * as SystemEnumeration from "@/meta/systemEnumerations"
import { ITypeDescription } from "@/elements/interfaces"

export type ExplicitUndefined<T> = T | undefined

export interface IManagedFormElement extends IFormElement, IFormItemable, IFormNameable {
  title: string
}

export interface IInputFieldElement extends IFormElement, IFormAttributeable {
  properties: IInputFieldElementProperties

  value: string | boolean | number | Date
}

export interface IInputFieldElementProperties
  extends IFormElementProperties,
    IFormAttributeableProperties,
    IFormHorizontalAlignableProperties,
    IFormHorizontalStretchableProperties {
  title: string
  height: number
  multiLine: boolean

  choiceButton: boolean | undefined
  dropListButton: boolean | undefined
  сlearButton: boolean | undefined
  openButton: boolean | undefined
  spinButton: boolean | undefined
}

export interface ICheckBoxFieldElementProperties
  extends IFormElementProperties,
    IFormAttributeableProperties,
    IFormHorizontalAlignableProperties {
  title: string
  height: number
  checkBoxType: SystemEnumeration.CheckBoxType
  titleLocation: SystemEnumeration.FormItemTitleLocation
}

export interface ICheckBoxFieldElement extends IFormElement, IFormAttributeable, IFormNameable {
  properties: ICheckBoxFieldElementProperties

  value: boolean
}

export interface IFormElement {
  properties: IFormElementProperties
}

export interface IFormElementProperties {}

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
  horizontalStretch: ExplicitUndefined<boolean>
}
