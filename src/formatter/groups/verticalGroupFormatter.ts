import { GroupElement } from "@/elements"
import * as t from "../../parser/lexer"
import { PropertiesFormatter } from "../propertiesFormatter"
import { IFormatterParams, WrapInGroupStrategy } from "../interfaces"
import { BaseFormatter } from "../baseFormatter"
import { FormatterFactory } from "../formatterFactory"
import { AlwaysWrapInGroupStrategy } from "../indentation/alwaysWrapInGroupStrategy"
import { VerticalGroupMatcherStrategy } from "../matcher/vericalGroupMatcherStrategy"

export class VerticalGroupFormatter extends BaseFormatter<GroupElement> {
  public format(element: GroupElement, params: IFormatterParams): string[] {
    let result: string[] = []

    if (params.wrapInGroup != WrapInGroupStrategy.None) {
      const header = this.getHeader(element)
      result.push(header)
    }

    result.push(...FormatterFactory.renderItems(element.items))

    return result
  }

  private getHeader(element: GroupElement): string {
    const excludeProperties = ["Заголовок", "Поведение", "Группировка"]

    const levelDisplay = this.getLevelDisplay(element)
    if (!levelDisplay.display) {
      excludeProperties.push("Отображение")
    }

    let level = levelDisplay.level

    let result = (t.Hash.LABEL as string).repeat(level)

    result += element.properties.get("Заголовок") ?? ""

    const properties = PropertiesFormatter.render(element, { excludeProperties })
    result += properties

    return result
  }

  private getLevelDisplay(element: GroupElement): { level: number; display: boolean } {
    const result: { level: number; display: boolean } = { level: 1, display: false }

    const display = element.getProperty("Отображение")?.toString().toLowerCase()
    const behavior = element.getProperty("Поведение")?.toString().toLowerCase()

    const levelBehavior: Map<string, number> = new Map([
      ["свертываемая", 5],
      ["всплывающая", 6],
    ])

    if (behavior && levelBehavior.has(behavior)) {
      result.level = levelBehavior.get(behavior) ?? 1
      if (display && display !== "обычноевыделение") {
        result.display = true
      }
      return result
    }

    const levelDisplay: Map<string, number> = new Map([
      ["нет", 1],
      ["слабоевыделение", 2],
      ["обычноевыделение", 3],
      ["сильноевыделение", 4],
    ])

    if (display && levelDisplay.has(display)) {
      result.level = levelDisplay.get(display) ?? 1
    }

    return result
  }
}

FormatterFactory.register(
  new VerticalGroupFormatter(new VerticalGroupMatcherStrategy(GroupElement), new AlwaysWrapInGroupStrategy())
)
