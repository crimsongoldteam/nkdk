import {
  IFormElementProperties,
  IFormHorizontalAlignableProperties,
  IFormHorizontalStretchableProperties,
} from "../../interfaces"
import { IFormElement } from "@/elements/interfaces"

export interface ILabelFormDecoration extends IFormElement {
  properties: ILabelFormDecorationProperties
}

export interface ILabelFormDecorationProperties
  extends IFormElementProperties,
    IFormHorizontalAlignableProperties,
    IFormHorizontalStretchableProperties {
  title: string
  height: number
}
