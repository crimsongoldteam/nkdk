import { IFormElement } from "../../interfaces"

export interface IClientApplicationForm extends IFormElement {
  // readonly properties: IClientApplicationFormProperties
  title?: string

  items: IFormElement[]
}
