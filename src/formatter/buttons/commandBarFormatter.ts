import { ButtonElement } from "../../elements/buttonElement"
import { ButtonGroupElement } from "../../elements/buttonGroupElement"
import { CommandBarElement } from "../../elements/commandBarElement"
import * as t from "../../parser/lexer"
import { FormatterFactory } from "../formatterFactory"
import { FormatterUtils } from "../helpers/formatterUtils"
import { BaseElementMatcherStrategy } from "../matcher/baseElementMatcherStrategy"
import { ConditionWrapInGroupStrategy } from "../indentation/conditionWrapInGroupStrategy"
import { BaseFormatter } from "../baseFormatter"
import { PropertiesFormatter } from "../propertiesFormatter"
import { FormGroupType } from "@/metadata/interface"

const SEPARATOR = " " + t.VBar.LABEL + " "
const MENU_LEVEL_INDICATOR = t.Dots.LABEL as string
const GROUP_INDICATOR = t.Dash.LABEL as string

export class CommandBarFormatter extends BaseFormatter<CommandBarElement> {
  public format(element: CommandBarElement): string[] {
    const excludeProperties = ["ГоризонтальноеПоложениеВГруппе"]
    FormatterUtils.excludeStretchProperties(excludeProperties, element)

    const properties = PropertiesFormatter.renderInineProperties(element, { excludeProperties })

    const buttons = element.getAllButtons()
    const { firstLineText, hasMenu } = this.formatFirstLine(buttons)

    if (!hasMenu) {
      return [this.formatSingleLine(firstLineText, element, properties)]
    }

    return this.formatWithMenu(firstLineText, buttons, element, properties)
  }

  private formatFirstLine(buttons: (ButtonElement | ButtonGroupElement)[]): {
    firstLineText: string
    hasMenu: boolean
  } {
    const firstLine: string[] = []
    let hasMenu = false

    for (const button of buttons) {
      if (button.elementKind === FormGroupType.Popup) {
        hasMenu = true
      }

      const text = FormatterFactory.render(button)
      firstLine.push(text.join(""))
    }

    return {
      firstLineText: firstLine.join(SEPARATOR),
      hasMenu,
    }
  }

  private formatSingleLine(content: string, element: CommandBarElement, properties: string[]): string {
    let result = FormatterUtils.getAlignmentAtLeft(element)

    result += t.LAngle.LABEL + " "

    if (content.length > 0) {
      result += content + " "
    }

    result += t.RAngle.LABEL + properties.join("")
    result += FormatterUtils.getAlignmentAtRight(element)

    return result
  }

  private formatWithMenu(
    firstLineText: string,
    buttons: (ButtonElement | ButtonGroupElement)[],
    element: CommandBarElement,
    properties: string[]
  ): string[] {
    const result: string[] = [t.LAngle.LABEL + " " + firstLineText]

    for (const button of buttons) {
      if (button.elementKind === FormGroupType.Popup) {
        this.formatMenuLine(result, button, 0)
      }
    }

    const lastLine = result.pop()!
    result.push(lastLine + " " + t.RAngle.LABEL + properties.join("") + FormatterUtils.getAlignmentAtRight(element))

    return result
  }

  private formatMenuLine(result: string[], element: ButtonElement | ButtonGroupElement, level: number): void {
    if (element.elementKind === FormGroupType.ButtonGroup) {
      result.push(this.getTextWithLevel(GROUP_INDICATOR, level))
      this.formatMenuLineSubitems(result, element, level + 1)
      return
    }

    const text = FormatterFactory.render(element).join("")
    result.push(this.getTextWithLevel(text, level))

    if (element.elementKind === FormGroupType.Popup) {
      this.formatMenuLineSubitems(result, element as ButtonElement, level + 1)
    }
  }

  private formatMenuLineSubitems(result: string[], element: ButtonElement | ButtonGroupElement, level: number): void {
    const items = element.items
    for (const item of items) {
      this.formatMenuLine(result, item, level)
    }
  }

  private getTextWithLevel(text: string, level: number): string {
    if (level === 0) {
      return text
    }

    const levelText = MENU_LEVEL_INDICATOR.repeat(level)
    return levelText ? levelText + " " + text : text
  }
}

FormatterFactory.register(
  new CommandBarFormatter(new BaseElementMatcherStrategy(CommandBarElement), new ConditionWrapInGroupStrategy())
)
