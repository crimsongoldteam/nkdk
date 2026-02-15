import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/types"
import { ConfigurationContext } from "../../context/types"
import { importMetadataFieldFromEnterprise } from "../metadataField/importFromEnterprise"
import { ChoiceParameterLinks, ChoiceParameterLinksEnterprise } from "./types"

/**
 * Парсит строку вида "Отбор.Владелец(Справочник.Справочник1.Реквизит.Реквизит1), Отбор.Владелец2(Справочник.Справочник2.Реквизит.Реквизит2)"
 * в массив ChoiceParameterLinks
 */
const parseChoiceParameterLinksString = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  value: string
): ChoiceParameterLinks => {
  const result: ChoiceParameterLinks = []
  let currentIndex = 0

  while (currentIndex < value.length) {
    while (currentIndex < value.length && (value[currentIndex] === " " || value[currentIndex] === ",")) {
      currentIndex++
    }
    if (currentIndex >= value.length) break

    const nameStart = currentIndex
    let nameEnd = currentIndex
    while (nameEnd < value.length && value[nameEnd] !== "(") {
      nameEnd++
    }
    if (nameEnd >= value.length) {
      throw new Error(`Invalid ChoiceParameterLinks format: missing opening parenthesis at position ${currentIndex}`)
    }

    const name = value.slice(nameStart, nameEnd).trim()
    currentIndex = nameEnd + 1 // Пропускаем открывающую скобку

    let parenDepth = 1
    let dataPathStart = currentIndex
    let dataPathEnd = currentIndex
    let hasDontChange = false

    while (currentIndex < value.length && parenDepth > 0) {
      if (value[currentIndex] === "(") {
        parenDepth++
      } else if (value[currentIndex] === ")") {
        parenDepth--
        if (parenDepth === 0) {
          dataPathEnd = currentIndex
          break
        }
      }
      currentIndex++
    }

    if (parenDepth > 0) {
      throw new Error(`Invalid ChoiceParameterLinks format: unclosed parenthesis starting at position ${nameEnd}`)
    }

    const content = value.slice(dataPathStart, dataPathEnd).trim()

    // Проверяем наличие "НеИзменять" в конце содержимого
    let dataPath = content
    if (content.endsWith(", НеИзменять") || content.endsWith(",НеИзменять")) {
      hasDontChange = true
      const commaIndex = content.lastIndexOf(",")
      dataPath = content.slice(0, commaIndex).trim()
    }

    // Преобразуем dataPath из Enterprise формата в XML формат
    const xmlDataPath = importMetadataFieldFromEnterprise(context, undefined, dataPath)
    if (!xmlDataPath) {
      throw new Error(`Invalid dataPath: ${dataPath}`)
    }

    result.push({
      name,
      dataPath: xmlDataPath,
      valueChange: hasDontChange ? "DontChange" : "Clear",
    })

    currentIndex++ // Пропускаем закрывающую скобку
  }

  return result
}

export const importChoiceParameterLinksFromEnterprise = (
  context: ConfigurationContext,
  rule: PropertyRule<any> | undefined,
  data: ChoiceParameterLinksEnterprise | undefined
): ChoiceParameterLinks | undefined => {
  if (!data) return undefined

  return parseChoiceParameterLinksString(context, rule, data)
}

registerTypeRule("ChoiceParameterLinks", "importFromEnterprise", importChoiceParameterLinksFromEnterprise)
