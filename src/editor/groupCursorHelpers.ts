import { FormatterFactory } from "@/formatter/formatterFactory"
import { FormElement } from "@/elements/formElement"
import { CSTGenerator } from "./cstGenerator"
import { ICursorBuilder, ICursorFormatter, IModelCursor } from "./interfaces"
import { GroupElement } from "@/elements/groupElement"
import { WrapInGroupStrategy } from "@/formatter/interfaces"

export class GroupCursorFormatter implements ICursorFormatter {
  public format(element: FormElement): string {
    const text = FormatterFactory.render(element, { wrapInGroup: WrapInGroupStrategy.None })
    return text.join("\n")
  }
}

export class GroupCursorBuilder implements ICursorBuilder {
  public build(text: string, cursor: IModelCursor): void {
    const currentGroup = cursor.getCst() as GroupElement

    currentGroup.items = []

    const result = CSTGenerator.build(text, "parseGroupEditorContainer")
    cursor.setSemanticTokensManager(result.semanticTokensManager)

    for (const item of (result.element as GroupElement).items) {
      currentGroup.items.push(item)
      item.parent = currentGroup
    }
  }
}
