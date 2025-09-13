import { RadioButtonElement } from "../elements/radioButtonElement"
import { FormatterFactory } from "./formatterFactory"
import { BaseElementMatcherStrategy } from "./matcher/baseElementMatcherStrategy"
import { ConditionWrapInGroupStrategy } from "./indentation/conditionWrapInGroupStrategy"
import { FormatterUtils } from "./helpers/formatterUtils"
import { BaseFormatter } from "./baseFormatter"
import { IFormatterParams } from "./interfaces"
import { PropertiesFormatter } from "./propertiesFormatter"

export class RadioButtonFormatter extends BaseFormatter<RadioButtonElement> {
  public format(element: RadioButtonElement, _params: IFormatterParams): string[] {
    let excludeProperties = ["Заголовок", "ГоризонтальноеПоложениеВГруппе", "СписокВыбора"]

    FormatterUtils.excludeStretchProperties(excludeProperties, element)

    const properties = PropertiesFormatter.render(element, { excludeProperties })

    let result = FormatterUtils.getAlignmentAtLeft(element)

    let header = element.getProperty("Заголовок")
    if (header) {
      result += header + ": "
    }

    let items = element.getProperty("СписокВыбора") as string[]

    result += this.formatItems(items, element.value).join(" ")

    result += properties.join("")
    result += FormatterUtils.getAlignmentAtRight(element)

    return [result]
  }

  private formatItems(items: string[], value: number): string[] {
    let result = []
    for (let index = 0; index < items.length; index++) {
      const item = items[index]
      result.push(FormatterUtils.getRadioButtonItemString(item, index === value))
    }
    return result
  }
}

FormatterFactory.register(
  new RadioButtonFormatter(new BaseElementMatcherStrategy(RadioButtonElement), new ConditionWrapInGroupStrategy())
)
