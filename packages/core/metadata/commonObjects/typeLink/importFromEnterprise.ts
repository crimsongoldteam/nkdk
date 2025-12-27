import { Context } from "../../context/types"
import { importMetadataFieldFromEnterprise } from "../metadataField/importFromEnterprise"
import { TypeLink, TypeLinkEnterprise } from "./types"

export const importTypeLinkFromEnterprise = (
  context: Context,
  data: TypeLinkEnterprise | undefined
): TypeLink | undefined => {
  if (!data) return undefined

  // Парсим строку, извлекая linkItem из скобок, если они есть
  // Формат: "Справочник.КакойТоСправочник.ТабличнаяЧасть.КакаяТоТаблица.Реквизит.КакойТоРеквизит(1)"
  const linkItemMatch = data.match(/\((\d+)\)$/)
  let dataPathEnterprise: string
  let linkItem: number

  if (linkItemMatch) {
    // Есть linkItem в скобках
    dataPathEnterprise = data.slice(0, -linkItemMatch[0].length)
    linkItem = Number(linkItemMatch[1])
  } else {
    // Нет linkItem, используем 0 по умолчанию
    dataPathEnterprise = data
    linkItem = 0
  }

  // Преобразуем dataPath из формата Enterprise в формат XML
  const dataPath = importMetadataFieldFromEnterprise(context, dataPathEnterprise)
  if (!dataPath) return undefined

  return {
    dataPath,
    linkItem,
  }
}
