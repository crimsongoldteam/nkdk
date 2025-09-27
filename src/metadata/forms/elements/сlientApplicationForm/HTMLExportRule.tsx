import { DITokens } from "@/symbols"
import { injectable } from "tsyringe"
import { IHTMLExportRules } from "../../interfaces"
import { IClientApplicationForm } from "./interfaces"
import React from "react"
import { Button, Modal } from "react-bootstrap"

@injectable({ token: DITokens.ClientApplicationForm.HTMLExportRules })
export class ClientApplicationFormHTMLExportRule implements IHTMLExportRules<IClientApplicationForm> {
  export(element: IClientApplicationForm): React.ReactNode {
    const title = element.title?.ru ?? ""

    return (
      <Modal>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body></Modal.Body>
        <Modal.Footer></Modal.Footer>
      </Modal>
    )
  }
}
