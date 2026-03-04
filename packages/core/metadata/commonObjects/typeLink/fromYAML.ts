import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { ConfigurationContext } from "../../context/types"
import { importMetadataFieldFromYAML } from "../metadataField/fromYAML"
import { TypeLink, TypeLinkYAML } from "./types"

export const importTypeLinkFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: TypeLinkYAML | undefined
): TypeLink | undefined => {
  if (!data) return undefined

  // Парсим строку, извлекая linkItem из скобок, если они есть
  // Формат: "Справочник.КакойТоСправочник.ТабличнаяЧасть.КакаяТоТаблица.Реквизит.КакойТоРеквизит(1)"
  const linkItemMatch = data.match(/\((\d+)\)$/)
  let dataPathYAML: string
  let linkItem: number

  if (linkItemMatch) {
    // Есть linkItem в скобках
    dataPathYAML = data.slice(0, -linkItemMatch[0].length)
    linkItem = Number(linkItemMatch[1])
  } else {
    // Нет linkItem, используем 0 по умолчанию
    dataPathYAML = data
    linkItem = 0
  }

  // Преобразуем dataPath из формата YAML в формат XML
  const dataPath = importMetadataFieldFromYAML(context, undefined, dataPathYAML)
  if (!dataPath) return undefined

  return {
    dataPath,
    linkItem,
  }
}

registerTypeRule("TypeLink", "importFromYAML", importTypeLinkFromYAML)
