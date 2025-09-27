import { IFormElement, I8nText } from "../../interfaces"

export interface IClientApplicationForm extends IFormElement {
  title?: I8nText

  items: IFormElement[]
}
