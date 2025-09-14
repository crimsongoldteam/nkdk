import {
  IFormAttributeable,
  IFormNameable as IFormNameable,
  FormItemable as IFormItemable,
  IFormAttributeableProperties,
} from "./mixins/interfaces"
import * as SystemEnumeration from "@/meta/systemEnumerations"
import { ITypeDescription } from "@/elements/interfaces"

// Тип для явного обозначения undefined значений
export type ExplicitUndefined<T> = T | undefined

export interface IManagedFormElement extends IFormElement, IFormItemable, IFormNameable {
  title: string
}

export interface IInputFieldElement extends IFormElement, IFormAttributeable {
  properties: IInputFieldElementProperties
}

export interface IInputFieldElementProperties
  extends IFormElementProperties,
    IFormAttributeableProperties,
    IFormHorizontalAlignableStretchableProperties {
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
    IFormHorizontalAlignableStretchableProperties {
  title: string
  height: number
}

export interface ICheckBoxFieldElement
  extends IFormElement,
    IFormAttributeable,
    IFormNameable,
    IFormHorizontalAlignableStretchableProperties {
  properties: ICheckBoxFieldElementProperties
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

export interface IFormHorizontalAlignableStretchableProperties {
  horizontalAlignInGroup: SystemEnumeration.HorizontalAlign
  horizontalStretch: ExplicitUndefined<boolean>
}
