import { FormatterFactory } from "../../../../formatter/formatterFactory"
import { FormatterUtils } from "../../../../formatter/helpers/formatterUtils"
import { BaseFormatter } from "../../../../formatter/baseFormatter"
import { BaseElementMatcherStrategy } from "../../../../formatter/matcher/baseElementMatcherStrategy"
import { ConditionWrapInGroupStrategy } from "../../../../formatter/indentation/conditionWrapInGroupStrategy"
import { PropertiesFormatter } from "../../../../formatter/propertiesFormatter"
import { ICheckBoxField } from "./interfaces"

export class CheckboxFormatter extends BaseFormatter<ICheckBoxField> {
  public format(element: ICheckBoxField): string[] {
    // let excludeProperties = ["Заголовок", "ГоризонтальноеПоложениеВГруппе", "ПоложениеЗаголовка", "ВидФлажка"]

    // FormatterUtils.excludeStretchProperties(excludeProperties, element)

    const properties = PropertiesFormatter.render(element)

    let header = element.properties.title

    let result = FormatterUtils.getAlignmentAtLeft(element)

    result += FormatterUtils.getCheckboxString(
      header,
      true,
      element.properties.checkBoxType,
      element.value,
      element.properties.titleLocation
    )

    result += properties.join("")
    result += FormatterUtils.getAlignmentAtRight(element)

    return [result]
  }
}

// FormatterFactory.register(
//   new CheckboxFormatter(new BaseElementMatcherStrategy(CheckboxElement), new ConditionWrapInGroupStrategy())
// )
