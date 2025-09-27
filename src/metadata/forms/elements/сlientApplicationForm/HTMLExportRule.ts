import { DITokens } from "@/symbols"
import { injectable } from "tsyringe"
import { IHTMLExportRules } from "../../interfaces"
import { IClientApplicationForm } from "./interfaces"

@injectable({ token: DITokens.ClientApplicationForm.HTMLExportRules })
export class ClientApplicationFormHTMLExportRule implements IHTMLExportRules<IClientApplicationForm> {
  export(element: IClientApplicationForm): string {
    const title = element.title?.ru ?? ""
    const itemsHtml = element.items
      .map((item) => {
        const itemTitle = (item as any).title?.ru ?? ""
        return `<div class="modal-body-item">${itemTitle}</div>`
      })
      .join("")

    return `
      <div class="modal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              ${itemsHtml}
            </div>
            <div class="modal-footer"></div>
          </div>
        </div>
      </div>
    `
  }
}
