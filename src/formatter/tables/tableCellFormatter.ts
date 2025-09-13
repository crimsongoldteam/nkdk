import { TableCellElement } from "@/elements/tableCellElement"
import { FormatterUtils } from "../helpers/formatterUtils"
import { BaseFormatter } from "../baseFormatter"
import { FormatterFactory } from "../formatterFactory"
import { BaseElementMatcherStrategy } from "../matcher/baseElementMatcherStrategy"
import { ConditionWrapInGroupStrategy } from "../indentation/conditionWrapInGroupStrategy"
import { IFormatterParams } from "../interfaces"

export class TableCellFormatter extends BaseFormatter<TableCellElement> {
  public format(element: TableCellElement, params: IFormatterParams): string[] {
    let text = ""

    const level = params.level ?? 0

    if (params.isFirst && level > 0) {
      text += ".".repeat(level)
    }

    const checkboxText = FormatterUtils.getCheckboxString(
      element.value,
      element.hasCheckbox,
      "Авто",
      element.valueCheckbox,
      "Право"
    )

    text = " " + text + checkboxText + " "

    return [text]
  }
}

FormatterFactory.register(
  new TableCellFormatter(new BaseElementMatcherStrategy(TableCellElement), new ConditionWrapInGroupStrategy())
)
