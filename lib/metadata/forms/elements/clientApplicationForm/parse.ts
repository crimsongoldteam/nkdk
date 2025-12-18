import type { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { FormElementType } from "../../../metadataFactory/types"
import type { ClientApplicationForm } from "./types"

export const parseClientApplicationForm = (
  _text: string,
  _configurationSettings: ConfigurationSettings
): ClientApplicationForm => {
  // const cst = parseRegions(text)
  // const visitor = new RegionsVisitor()
  // const sections = visitor.lines(cst)
  // const result: ClientApplicationForm = {
  //   elementType: FormElementType.Form,
  //   childItems: [],
  // }
  // // Находим секцию "Реквизиты" и парсим атрибуты
  // const attributesSection = sections.find(
  //   (section) => section.title === "Реквизиты"
  // )
  // if (attributesSection) {
  //   // Извлекаем содержимое секции напрямую из исходного текста,
  //   // так как лексер теряет некоторые символы (двоеточия, пробелы)
  //   const lines = text.split("\n")
  //   let inAttributesSection = false
  //   let attributesStartIndex = -1
  //   let attributesEndIndex = lines.length
  //   for (let i = 0; i < lines.length; i++) {
  //     const line = lines[i].trim()
  //     if (line === "--- Реквизиты ---") {
  //       inAttributesSection = true
  //       attributesStartIndex = i + 1
  //     } else if (
  //       inAttributesSection &&
  //       line.startsWith("---") &&
  //       line.endsWith("---")
  //     ) {
  //       attributesEndIndex = i
  //       break
  //     }
  //   }
  //   if (
  //     attributesStartIndex >= 0 &&
  //     attributesStartIndex < attributesEndIndex
  //   ) {
  //     const content = lines
  //       .slice(attributesStartIndex, attributesEndIndex)
  //       .join("\n")
  //       .trim()
  //     if (content) {
  //       const attributes = parseAttributes(content, configurationSettings)
  //       // Генерируем ID для атрибутов
  //       attributes.forEach((attr, index) => {
  //         attr.id = (index + 1).toString()
  //       })
  //       result.attributes = attributes
  //     }
  //   }
  // }

  return {
    elementType: FormElementType.Form,
    childItems: [],
  }
}
