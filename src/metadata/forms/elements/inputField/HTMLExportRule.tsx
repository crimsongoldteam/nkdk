import { DITokens } from "@/symbols"
import { injectable } from "tsyringe"
import { IHTMLExportRules } from "../../interfaces"
import { IInputField } from "./interfaces"
import React from "react"
import { Form } from "react-bootstrap"

@injectable({ token: DITokens.InputField.HTMLExportRules })
export class InputFieldHTMLExportRule implements IHTMLExportRules<IInputField> {
  export(element: IInputField): React.ReactNode {
    const title = element.title?.ru ?? ""

    return (
      <Form.Group>
        <Form.Label>{title}</Form.Label>
        <Form.Control />
      </Form.Group>
    )
  }
}
