import { injectable } from "tsyringe"
import { DITokens } from "@/symbols"
import { IClientApplicationForm } from "./interfaces"
import { IFormElement, I8nText } from "../../interfaces"

@injectable({ token: DITokens.ClientApplicationForm.Element })
export class ClientApplicationForm implements IClientApplicationForm {
  items: IFormElement[] = []
  title?: I8nText

  public get XMLExporterToken(): symbol {
    return DITokens.ClientApplicationForm.XMLExporter
  }

  public get formatterToken(): symbol {
    return DITokens.ClientApplicationForm.Formatter
  }
}
