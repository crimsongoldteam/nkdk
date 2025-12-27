import { parse } from "yaml"
import { parseBoolean } from "~/packages/core/metadata/commonObjects/boolean/importFromEnterprise"
import { parseI8nText } from "~/packages/core/metadata/commonObjects/i8nText/importFromEnterprise"
import { importTypeDescriptionFromEnterprise } from "~/packages/core/metadata/commonObjects/typeDescription/importFromEnterprise"
import { parseUserVisible } from "~/packages/core/metadata/commonObjects/userVisible/parse"
import { Context } from "~/packages/core/metadata/context/types"
import { FormAttribute } from "../types"

export const parseAttributes = (yamlContent: string, context: Context): FormAttribute[] => {
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
        attribute.title = parseI8nText(data.Заголовок, context)
      }

      // Обработка Тип
      if ("Тип" in data && typeof data.Тип === "string") {
        attribute.type = importTypeDescriptionFromEnterprise(context, data.Тип)
      }

      // Обработка ОсновнойАтрибут
      if ("ОсновнойАтрибут" in data) {
        attribute.mainAttribute = parseBoolean(data.ОсновнойАтрибут, context)
      }

      // Обработка СохраняемыеДанные
      if ("СохраняемыеДанные" in data) {
        attribute.storedData = parseBoolean(data.СохраняемыеДанные, context)
      }

      if ("РазрешитьИспользование" in data || "ЗапретитьИспользование" in data) {
        const userVisibleKey = "РазрешитьИспользование" in data ? "РазрешитьИспользование" : "ЗапретитьИспользование"
        attribute.use = parseUserVisible(data[userVisibleKey], userVisibleKey, context)
      }
    }

    result.push(attribute)
  }

  return result
}
