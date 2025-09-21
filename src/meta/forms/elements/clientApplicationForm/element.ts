import { IClientApplicationForm, IClientApplicationFormProperties } from "./interfaces"
import { IFormElement } from "@/elements/interfaces"
import { injectable } from "tsyringe"
import { TYPES } from "../../container/symbols"

@injectable({ token: TYPES.IClientApplicationForm })
export class ClientApplicationForm implements IClientApplicationForm {
  public properties: IClientApplicationFormProperties = {
    title: "",
  }
  public items: IFormElement[] = []
}
