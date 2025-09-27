import { DITokens } from "@/symbols"
import { container, injectable } from "tsyringe"
import { IFormElement, IXMLImportRules } from "../../interfaces"
import { IClientApplicationForm } from "./interfaces"

@injectable({ token: DITokens.ClientApplicationForm.XMLImportRules })
export class ClientApplicationFormXMLImportRules implements IXMLImportRules<IClientApplicationForm> {
  import(xmlData: any): IClientApplicationForm {
    const element = container.resolve<IClientApplicationForm>(DITokens.ClientApplicationForm.Element)

    const formNode = xmlData.Form

    if (formNode.Title) {
      element.title = formNode.Title
    }

    if (formNode.ChildItems && Array.isArray(formNode.ChildItems)) {
      element.items = formNode.ChildItems.map((item: any) => {
        return this.importChildItem(item)
      })
    }

    return element
  }

  private importChildItem(data: any): IFormElement {
    return container.resolve<IXMLImportRules<IFormElement>>(DITokens.InputField.XMLImportRules).import(data)
  }
}
