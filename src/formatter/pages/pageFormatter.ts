import { PageElement } from "../../elements/pageElement"
import * as t from "../../parser/lexer"
import { PropertiesFormatter } from "../propertiesFormatter"
import { BaseFormatter } from "../baseFormatter"
import { IFormatterParams } from "../interfaces"
import { BaseElementMatcherStrategy } from "../matcher/baseElementMatcherStrategy"
import { AlwaysWrapInGroupStrategy } from "../indentation/alwaysWrapInGroupStrategy"
import { FormatterFactory } from "../formatterFactory"

export class PageFormatter extends BaseFormatter<PageElement> {
  public format(element: PageElement, _params: IFormatterParams): string[] {
    const result: string[] = []

    const header = this.getHeader(element)
    result.push(header)

    result.push(...FormatterFactory.renderItems(element.items))

    return result
  }

  private getHeader(element: PageElement): string {
    const excludeProperties = ["Заголовок"]

    const properties = PropertiesFormatter.render(element, { excludeProperties })

    let result = t.Slash.LABEL as string

    result += element.properties.get("Заголовок") ?? ""

    result += properties

    return result
  }
}

FormatterFactory.register(
  new PageFormatter(new BaseElementMatcherStrategy(PageElement), new AlwaysWrapInGroupStrategy())
)
