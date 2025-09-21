import * as t from "@/parser/lexer"
import { IFormatterParams } from "@/formatter/interfaces"
import { IClientApplicationForm } from "./interfaces"
import { IFormatter, IPropertiesEnterpriseTransform } from "../../interfaces"
import { TYPES } from "../../container/symbols"
import "reflect-metadata"
import "@/meta"
import { container, injectable } from "tsyringe"
import * as yaml from "js-yaml"
import { instanceToPlain } from "class-transformer"
import { FormatterFactory } from "../../factories/formatterFactory"

@injectable({ token: TYPES.IClientApplicationFormFormatter })
export class ClientApplicationFormFormatter implements IFormatter {
  public render(element: IClientApplicationForm, _params: IFormatterParams): string[] {
    const header = element.properties.title
    let result = []

    if (header) {
      const dashes = (t.Dashes.LABEL as string).repeat(3)
      result.push(dashes + " " + header + " " + dashes)
    }

    for (const item of element.items) {
      const formatter = container.resolve<FormatterFactory>(TYPES.FormatterFactory).get(item)
      const result = formatter.render(item, {})
      result.push(...result)
    }

    const properties = container.resolve<IPropertiesEnterpriseTransform>(
      TYPES.clientApplicationForm.propertiesEnterpriseTransform
    )
    properties.import(element.properties)

    const propertiesExport = instanceToPlain(properties)

    const propertiesWithRussianBooleans = this.replaceBooleans(propertiesExport)

    // Преобразуем properties в YAML
    const propertiesYaml = yaml.dump(propertiesWithRussianBooleans, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: true,
    })

    if (Object.keys(propertiesWithRussianBooleans).length > 0) {
      result.push("--- Свойства формы ---")
      result.push(...propertiesYaml.split("\n"))
    }

    // result.push(...FormatterFactory.renderItems(element.items))

    // result.forEach((item, index) => {
    //   result[index] = trimEnd.call(item, "")
    // })

    return result
  }

  // Функция для замены булевых значений на русские
  replaceBooleans = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj
    }

    if (typeof obj === "boolean") {
      return obj ? "Истина" : "Ложь"
    }

    if (Array.isArray(obj)) {
      return obj.map(this.replaceBooleans)
    }

    if (typeof obj === "object") {
      const result: any = {}
      for (const [key, value] of Object.entries(obj)) {
        if (value == undefined) continue
        result[key] = this.replaceBooleans(value)
      }
      return result
    }

    return obj
  }
}
