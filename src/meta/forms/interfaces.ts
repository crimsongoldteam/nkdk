import {
  FormAttributeable as IFormAttributeable,
  FormNameable as IFormNameable,
  FormItemable as IFormItemable,
} from "./mixins/interfaces"

export interface IManagedFormElement extends IFormElement, IFormItemable, IFormNameable {
  title: string
}

export interface IInputFieldElement extends IFormElement, IFormAttributeable, IFormNameable {
  height: number
  multiLine: boolean
  choiceButton: boolean
}
export interface IFormElement {}

export interface IFormAttribute {
  name: string
}
