import * as t from "@/metadata/forms/parser/lexer"
import { container, injectable, singleton } from "tsyringe"
import { IFormatter } from "../../interfaces"
import { IFormatterParams } from "../../../../formatter/types"
import { DITokens } from "@/symbols"
import { IClientApplicationForm } from "./interfaces"

@singleton()
@injectable({ token: DITokens.ClientApplicationForm.Formatter })
export class ClientApplicationFormFormatter implements IFormatter {
  private readonly DASHES = (t.Dashes.LABEL as string).repeat(3)

  public render(element: IClientApplicationForm, _params: IFormatterParams): string[] {
    const result: string[] = []

    let header = element.title?.ru ?? ""

    if (header) {
      header = this.DASHES + " " + header + " " + this.DASHES
      result.push(header)
    }

    for (const item of element.items) {
      const itemFormatted = container.resolve<IFormatter>(item.formatterToken).render(item, _params)
      result.push(...itemFormatted)
    }

    return result
  }
}
