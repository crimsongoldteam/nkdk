import { ButtonGroupElement } from "../../elements/buttonGroupElement"
import * as t from "../../parser/lexer"
import { BaseFormatter } from "../baseFormatter"
import { BaseElementMatcherStrategy } from "../matcher/baseElementMatcherStrategy"
import { ConditionWrapInGroupStrategy } from "../indentation/conditionWrapInGroupStrategy"
import { FormatterFactory } from "../formatterFactory"

export class ButtonGroupFormatter extends BaseFormatter<ButtonGroupElement> {
  public format(_element: ButtonGroupElement): string[] {
    return [" " + (t.Dash.LABEL as string)]
  }
}

FormatterFactory.register(
  new ButtonGroupFormatter(new BaseElementMatcherStrategy(ButtonGroupElement), new ConditionWrapInGroupStrategy())
)
