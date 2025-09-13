import { EditorContainerElement } from "../elements/editorContainerElement"
import trimEnd from "@ungap/trim-end"
import { FormatterFactory } from "./formatterFactory"
import { BaseFormatter } from "./baseFormatter"
import { BaseElementMatcherStrategy } from "./matcher/baseElementMatcherStrategy"
import { ConditionWrapInGroupStrategy } from "./indentation/conditionWrapInGroupStrategy"

export class EditorContainerFormatter extends BaseFormatter<EditorContainerElement> {
  public format(element: EditorContainerElement): string[] {
    const result: string[] = []

    for (const item of element.items) {
      const formatted = FormatterFactory.render(item)
      result.push(...formatted)
    }

    result.forEach((item, index) => {
      result[index] = trimEnd.call(item, "")
    })

    return result
  }
}

FormatterFactory.register(
  new EditorContainerFormatter(
    new BaseElementMatcherStrategy(EditorContainerElement),
    new ConditionWrapInGroupStrategy()
  )
)
