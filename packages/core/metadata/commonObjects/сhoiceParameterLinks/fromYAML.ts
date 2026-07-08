import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { importDataPathStandardMembersFromYAML } from "../metadataPath/dataPathStandardMembers"
import { importMetadataFieldFromYAML } from "../metadataField/fromYAML"
import type { ChoiceParameterLinks, ChoiceParameterLinksYAML } from "./types"

/**
 * Парсит строку вида "Отбор.Владелец(Справочник.Справочник1.Реквизит.Реквизит1), Отбор.Владелец2(Справочник.Справочник2.Реквизит.Реквизит2)"
 * в массив ChoiceParameterLinks
 */
const parseChoiceParameterLinksString = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
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

    // Преобразуем dataPath из YAML формата в XML формат
    const normalizedDataPath = importDataPathStandardMembersFromYAML(context, dataPath) as string
    const xmlDataPath = importMetadataFieldFromYAML(context, undefined, normalizedDataPath) ?? normalizedDataPath
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

export const importChoiceParameterLinksFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: ChoiceParameterLinksYAML | undefined
): ChoiceParameterLinks | undefined => {
  if (!data) return undefined
  if (typeof data === "string") return parseChoiceParameterLinksString(context, rule, data)

  return data.map((link) => ({
    name: link.Имя,
    dataPath: importDataPathStandardMembersFromYAML(context, link.ПутьКДанным) as string,
    valueChange: link.РежимИзменения === "НеИзменять" ? "DontChange" : "Clear",
  }))
}

registerTypeRule("ChoiceParameterLinks", "importFromYAML", importChoiceParameterLinksFromYAML)
