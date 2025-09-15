import { PropertiesFormatter } from "./propertiesFormatter"
import { FormatterUtils } from "./helpers/formatterUtils"
import { BaseFormatter } from "./baseFormatter"
import { BaseElementMatcherStrategy } from "./matcher/baseElementMatcherStrategy"
import { ConditionWrapInGroupStrategy } from "./indentation/conditionWrapInGroupStrategy"
import { FormatterFactory } from "./formatterFactory"

export class LabelFormDecorationFormatter extends BaseFormatter<ILabelFormDecoration> {
  public format(element: ILabelFormDecoration): string[] {
    let excludeProperties = ["ГоризонтальноеПоложениеВГруппе", "Заголовок"]

    FormatterUtils.excludeStretchProperties(excludeProperties, element)

    const properties = PropertiesFormatter.render(element, { excludeProperties })

    let result = FormatterUtils.getAlignmentAtLeft(element)
    result += element.properties.get("Заголовок") ?? ""
    result += properties.join("")
    result += FormatterUtils.getAlignmentAtRight(element)
    return [result]
  }
}

FormatterFactory.register(
  new LabelFormDecorationFormatter(new BaseElementMatcherStrategy(LabelElement), new ConditionWrapInGroupStrategy())
)
