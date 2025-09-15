import * as SystemEnumeration from "@/meta/systemEnumerations"
import { IFormAttributeableProperties, IFormAttributeable, IFormNameable } from "../../helpers/interfaces"
import { IFormElementProperties, IFormHorizontalAlignableProperties } from "../../interfaces"
import { IFormElement } from "@/elements/interfaces"

export interface ICheckBoxField extends IFormElement, IFormAttributeable, IFormNameable {
  properties: ICheckBoxFieldProperties

  value: boolean
}

export interface ICheckBoxFieldProperties
  extends IFormElementProperties,
    IFormAttributeableProperties,
    IFormHorizontalAlignableProperties {
  title: string
  height: number
  checkBoxType: SystemEnumeration.CheckBoxType
  titleLocation: SystemEnumeration.FormItemTitleLocation
}
