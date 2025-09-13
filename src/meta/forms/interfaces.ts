import {
  IFormAttributeable,
  FormNameable as IFormNameable,
  FormItemable as IFormItemable,
  IFormAttributeableProperties,
} from "./mixins/interfaces"
import * as SystemEnumeration from "@/meta/systemEnumerations"

// Тип для явного обозначения undefined значений
export type ExplicitUndefined<T> = T | undefined

export interface IManagedFormElement extends IFormElement, IFormItemable, IFormNameable {
  title: string
}

export interface IInputFieldElement
  extends IFormElement,
    IFormAttributeable,
    IFormNameable,
    IFormHorizontalAlignableStretchable {
  properties: IInputFieldElementProperties
}

export interface IInputFieldElementProperties extends IFormElementProperties, IFormAttributeableProperties {
  title: string
  height: number
  multiLine: boolean
  choiceButton: boolean
}

export interface IFormElement {
  properties: IFormElementProperties
}

export interface IFormElementProperties {}

export interface IFormAttribute {
  name: string
}

export interface IFormHorizontalAlignableStretchable {
  horizontalAlignInGroup: SystemEnumeration.HorizontalAlign
  horizontalStretch: ExplicitUndefined<boolean>
}
