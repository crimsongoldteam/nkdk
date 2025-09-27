import * as t from "@/metadata/forms/parser/lexer"
import { injectable, singleton } from "tsyringe"
import { IFormatter, IFormatterParams } from "../../interfaces"
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

    // result.push(...FormatterFactory.renderItems(element.items))

    // result.forEach((item, index) => {
    //   result[index] = trimEnd.call(item, "")
    // })

    return result
  }
}
