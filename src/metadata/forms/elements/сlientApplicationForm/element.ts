import { injectable } from "tsyringe"
import { DITokens } from "@/symbols"
import { IClientApplicationForm } from "./interfaces"
import { IFormElement } from "../../interfaces"

@injectable({ token: DITokens.ClientApplicationForm.Element })
export class ClientApplicationForm implements IClientApplicationForm {
  items: IFormElement[] = []
  title?: string

  public get XMLExporterToken(): symbol {
    return DITokens.ClientApplicationForm.XMLExporter
  }

  public get formatterToken(): symbol {
    return DITokens.ClientApplicationForm.Formatter
  }
}
