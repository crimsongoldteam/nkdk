import { DITokens } from "@/symbols"
import { injectable, container } from "tsyringe"
import { IFormElement, IHTMLExportRules } from "../../interfaces"
import { IClientApplicationForm } from "./interfaces"
import React from "react"
import { Card, Form } from "react-bootstrap"

@injectable({ token: DITokens.ClientApplicationForm.HTMLExportRules })
export class ClientApplicationFormHTMLExportRule implements IHTMLExportRules<IClientApplicationForm> {
  export(element: IClientApplicationForm): React.ReactNode {
    const title = element.title?.ru ?? ""

    return (
      <Form>
        <Form.Text>{title}</Form.Text>
        {element.items.map((item, index) => {
          const itemFormatted = container
            .resolve<IHTMLExportRules<IFormElement>>(item.HTMLExportRulesToken)
            .export(item)
          return <React.Fragment key={index}>{itemFormatted}</React.Fragment>
        })}
      </Form>
    )
  }
}
