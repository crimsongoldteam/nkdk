import { IFormElement } from "@/elements/interfaces"
import { IFormAttributeable, IFormAttributeableProperties } from "../../helpers/interfaces"
import {
  IFormElementProperties,
  IFormHorizontalAlignableProperties,
  IFormHorizontalStretchableProperties,
} from "../../interfaces"

export interface IInputField extends IFormElement, IFormAttributeable {
  properties: IInputFieldProperties

  value: string | boolean | number | Date
}

export interface IInputFieldProperties
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
