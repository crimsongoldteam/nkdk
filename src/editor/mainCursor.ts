import { FormElement } from "@/elements/formElement"
import { CSTGenerator } from "./cstGenerator"
import { ICursorBuilder, ICursorFormatter, IModelCursor } from "./interfaces"
import { FormatterFactory } from "@/formatter"

export class MainCursorFormatter implements ICursorFormatter {
  public format(element: FormElement): string {
    const text = FormatterFactory.render(element)
    return text.join("\n")
  }
}

export class MainCursorBuilder implements ICursorBuilder {
  public build(text: string, cursor: IModelCursor): void {
    const result = CSTGenerator.build(text, "parseForm")
    cursor.setSemanticTokensManager(result.semanticTokensManager)
    cursor.model.cst = result.element
  }
}
