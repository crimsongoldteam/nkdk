import { IFormElement } from "@/elements/interfaces"
import { IFormElementProperties } from "../../interfaces"

export interface IClientApplicationForm extends IFormElement {
  properties: IClientApplicationFormProperties
  items: IFormElement[]
}

export interface IClientApplicationFormProperties extends IFormElementProperties {
  title?: string
  autoTitle?: boolean
}
