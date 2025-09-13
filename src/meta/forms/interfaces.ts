import {
  FormAttributeable as IFormAttributeable,
  FormNameable as IFormNameable,
  FormItemable as IFormItemable,
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
  title: string
  height: number
  multiLine: boolean
  choiceButton: boolean

  value: string | boolean | number | Date
}
export interface IFormElement {}

export interface IFormAttribute {
  name: string
}

export interface IFormHorizontalAlignableStretchable {
  horizontalAlignInGroup: SystemEnumeration.HorizontalAlign
  horizontalStretch: ExplicitUndefined<boolean>
}
