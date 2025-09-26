import { DITokens } from "@/symbols"
import { container, injectable } from "tsyringe"
import { IXMLImportRules } from "../../interfaces"
import { IClientApplicationForm } from "./interfaces"

@injectable({ token: DITokens.ClientApplicationForm.XMLImportRules })
export class InputFieldXMLTransform implements IXMLImportRules<IClientApplicationForm> {
  import(xmlData: any): IClientApplicationForm {
    const element = container.resolve<IClientApplicationForm>(DITokens.ClientApplicationForm.Element)

    const formNode = xmlData.Form

    if (formNode.Title) {
      element.title = formNode.Title
    }

    return element
  }
}
