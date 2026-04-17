import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { importFixedArrayFromYAML } from "./fixedArray/fromYAML"
import { importFormChoiceListFromYAML } from "./formChoiceList/fromYAML"
import { primitiveValueHandlers } from "./handlers"
import {
  MetadataFixedArrayValueYAML,
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueYAML,
  MetadataPrimitiveValueType,
  MetadataStringValue,
  MetadataTypedValue,
  MetadataValuePropertyRule,
  MetadataValueType,
  MetadataValueYAML,
  normalizeValueType,
} from "./types"

type MetadataSingleYAML = string | number

const PRIMITIVE_TYPES: readonly MetadataPrimitiveValueType[] = [
  "string",
  "decimal",
  "dateTime",
  "boolean",
  "ref",
  "objectRef",
]

/**
 * Импортирует MetadataValue из YAML. Всегда возвращает тегированную форму {type, value}.
 *
 * Если `rule.valueType` — массив (новый режим): делегирует в хендлер по типу значения из YAML.
 * Иначе (compat: одиночная строка valueType или undefined): использует эвристику.
 */
export const importMetadataValueFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataValueYAML | undefined
): MetadataTypedValue | undefined => {
  if (data === undefined) return undefined

  // Агрегатные типы определяются по форме данных, не по rule
  if (typeof data === "object" && !Array.isArray(data) && "Представление" in data) {
    return importFormChoiceListFromYAML(context, data as MetadataFormChoiceListValueYAML)
  }

  if (Array.isArray(data)) {
    return importFixedArrayFromYAML(context, data as MetadataFixedArrayValueYAML)
  }

  const ruleTyped = rule as MetadataValuePropertyRule | undefined
  const valueTypeArr = normalizeValueType(ruleTyped?.valueType)

  if (Array.isArray(ruleTyped?.valueType)) {
    // Новый режим: valueType — массив
    return dispatchFromYAMLByTypes(context, valueTypeArr!, data as MetadataSingleYAML)
  }

  // Compat/эвристический режим: нет массива valueType → определяем тип из значения
  return heuristicFromYAML(context, data as MetadataSingleYAML)
}

/**
 * Диспетчеризация для нового режима (valueType как массив).
 * Для каждого разрешённого типа пробует соответствующий хендлер.
 */
const dispatchFromYAMLByTypes = (
  context: ConfigurationContext,
  types: MetadataValueType[],
  data: MetadataSingleYAML
): MetadataTypedValue | undefined => {
  // Перебираем разрешённые типы и пробуем хендлер
  for (const type of types) {
    if (!PRIMITIVE_TYPES.includes(type as MetadataPrimitiveValueType)) continue
    const result = primitiveValueHandlers[type as MetadataPrimitiveValueType]?.fromYAML(context, data)
    if (result !== undefined) return result
  }

  // Если не распознали по разрешённым типам — используем эвристику
  return heuristicFromYAML(context, data)
}

/**
 * Эвристика: определяет тип из формы значения YAML (для режима без явного valueType).
 * Порядок проверок: число → boolean → dateTime → number → formChoiceList → строка в кавычках → ref → string.
 */
const heuristicFromYAML = (
  context: ConfigurationContext,
  data: MetadataSingleYAML
): MetadataTypedValue | undefined => {
  if (typeof data === "number") {
    return { type: "decimal", value: data }
  }

  if (typeof data !== "string") return undefined

  // FormChoiceList: "значение"(представление)
  const formChoiceListMatch = data.match(/^"([^"]+)"\(([^)]+)\)$/)
  if (formChoiceListMatch) {
    const [, value, presentation] = formChoiceListMatch
    return {
      type: "formChoiceListDesTimeValue",
      presentation: { items: { ru: presentation } },
      value: { type: "string", value } satisfies MetadataStringValue,
    }
  }

  // FormChoiceList с пустым значением: (представление)
  const emptyFormChoiceListMatch = data.match(/^\(([^)]+)\)$/)
  if (emptyFormChoiceListMatch) {
    const [, presentation] = emptyFormChoiceListMatch
    return {
      type: "formChoiceListDesTimeValue",
      presentation: { items: { ru: presentation } },
      value: undefined,
    }
  }

  // Строка в кавычках
  if (data.startsWith('"') && data.endsWith('"')) {
    return { type: "string", value: data.slice(1, -1) } satisfies MetadataStringValue
  }

  // Boolean
  if (data === "Истина" || data === "Ложь") {
    return { type: "boolean", value: data === "Истина" }
  }

  // DateTime: dd.MM.yyyy или dd.MM.yyyy HH:mm:ss
  const dateTimeMatch = data.match(/^\d{2}\.\d{2}\.\d{4}(\s+\d{2}:\d{2}:\d{2})?$/)
  if (dateTimeMatch) {
    const result = primitiveValueHandlers.dateTime.fromYAML(context, data)
    if (result) return result
  }

  // Число как строка
  if (!isNaN(Number(data)) && data.trim() !== "" && !isNaN(parseFloat(data))) {
    return { type: "decimal", value: Number(data) }
  }

  // Ref: строка с точками
  try {
    const refResult = primitiveValueHandlers.ref.fromYAML(context, data)
    if (refResult) return refResult
  } catch {
    // Не ref
  }

  // Fallback: строка
  return { type: "string", value: data } satisfies MetadataStringValue
}

/** @deprecated Используй importFormChoiceListFromYAML из submodule formChoiceList/fromYAML */
export const importFormChoiceListValueFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFormChoiceListValueYAML
): MetadataFormChoiceListValue => importFormChoiceListFromYAML(context, data)

/**
 * Импортирует AssociatedTable (строка YAML) → MetadataStringValue.
 */
export const importAssociatedTableFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: string | undefined
): MetadataStringValue | undefined => {
  if (data === undefined) return undefined
  return { type: "string", value: data } satisfies MetadataStringValue
}

registerTypeRule("MetadataValue", "importFromYAML", importMetadataValueFromYAML)
registerTypeRule("AssociatedTable", "importFromYAML", importAssociatedTableFromYAML as any)
