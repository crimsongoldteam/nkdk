import { injectable } from "tsyringe"
import type { IInputField } from "./interfaces"
import { DITokens } from "@/symbols"
import { I8nText } from "../../interfaces"

@injectable({ token: DITokens.InputField.Element })
export class InputField implements IInputField {
  title?: I8nText
  name?: string
  height?: number
  multiLine?: boolean

  public value: string | boolean | number | Date = ""

  public get XMLImportRulesToken(): symbol {
    return DITokens.InputField.XMLImportRules
  }

  public get formatterToken(): symbol {
    return DITokens.InputField.Formatter
  }

  public get XMLExporterToken(): symbol {
    return DITokens.InputField.XMLExporter
  }

  public isMultiline(): boolean {
    return (this.multiLine ?? false) && (this.height ?? 0) > 1
  }
}
