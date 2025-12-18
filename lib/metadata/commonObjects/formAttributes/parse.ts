import { parse } from "yaml"
import { parseBoolean } from "~/lib/metadata/commonObjects/boolean/parse"
import { parseI8nText } from "~/lib/metadata/commonObjects/i8nText/parse"
import { parseTypeDescription } from "~/lib/metadata/commonObjects/typeDescription/parse"
import { parseUserVisible } from "~/lib/metadata/commonObjects/userVisible/parse"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { FormAttribute } from "../types"

export const parseAttributes = (yamlContent: string, configurationSettings: ConfigurationSettings): FormAttribute[] => {
  const parsed = parse(yamlContent) as Record<string, any>
  const result: FormAttribute[] = []

  for (const [name, data] of Object.entries(parsed)) {
    const attribute: FormAttribute = {
      name,
      id: "",
    }

    if (data && typeof data === "object") {
      // Обработка Заголовок
      if ("Заголовок" in data) {
        attribute.title = parseI8nText(data.Заголовок, configurationSettings)
      }

      // Обработка Тип
      if ("Тип" in data && typeof data.Тип === "string") {
        attribute.type = parseTypeDescription(data.Тип)
      }

      // Обработка ОсновнойАтрибут
      if ("ОсновнойАтрибут" in data) {
        attribute.mainAttribute = parseBoolean(data.ОсновнойАтрибут, configurationSettings)
      }

      // Обработка СохраняемыеДанные
      if ("СохраняемыеДанные" in data) {
        attribute.storedData = parseBoolean(data.СохраняемыеДанные, configurationSettings)
      }

      if ("РазрешитьИспользование" in data || "ЗапретитьИспользование" in data) {
        const userVisibleKey = "РазрешитьИспользование" in data ? "РазрешитьИспользование" : "ЗапретитьИспользование"
        attribute.use = parseUserVisible(data[userVisibleKey], userVisibleKey, configurationSettings)
      }
    }

    result.push(attribute)
  }

  return result
}
