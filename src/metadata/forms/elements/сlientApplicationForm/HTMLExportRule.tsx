import { DITokens } from "@/symbols"
import { injectable, container } from "tsyringe"
import { IFormElement, IHTMLExportRules } from "../../interfaces"
import { IClientApplicationForm } from "./interfaces"
import React from "react"
import { Divider, Form } from "antd"
import Title from "antd/es/typography/Title"

@injectable({ token: DITokens.ClientApplicationForm.HTMLExportRules })
export class ClientApplicationFormHTMLExportRule implements IHTMLExportRules<IClientApplicationForm> {
  export(element: IClientApplicationForm): React.ReactNode {
    const title = element.title?.ru ?? ""

    return (
      <Form>
        <Form.Item>
          <Title>{title}</Title>
          <Divider />
          {element.items.map((item) => {
            const itemFormatted = container
              .resolve<IHTMLExportRules<IFormElement>>(item.HTMLExportRulesToken)
              .export(item)
            return <React.Fragment key={item.constructor.name}>{itemFormatted}</React.Fragment>
          })}
        </Form.Item>
      </Form>
    )
  }
}
