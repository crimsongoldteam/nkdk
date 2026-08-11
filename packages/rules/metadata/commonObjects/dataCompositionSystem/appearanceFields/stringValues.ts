const stringPropertyKeys = ["Текст", "Формат"] as const
const serviceKeys = new Set([
  "Использовать",
  "РежимОтображения",
  "ИдентификаторПользовательскойНастройки",
  "ПредставлениеПользовательскойНастройки",
])
const publicKeys = new Set(["Тип", "Значение", ...serviceKeys])

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined

const assertLanguageMap = (value: unknown): Record<string, string> => {
  const record = asRecord(value)
  if (record === undefined || Object.values(record).some((item) => typeof item !== "string")) {
    throw new Error("AppearanceFields YAML: Значение многоязычной строки должно быть картой строк")
  }
  return record as Record<string, string>
}

const normalizeStringParameter = (yaml: unknown): unknown => {
  if (typeof yaml === "string") return yaml

  const record = asRecord(yaml)
  if (record === undefined) {
    throw new Error("AppearanceFields YAML: строковое значение должно быть строкой или объектом")
  }
  if (Object.keys(record).some((key) => !publicKeys.has(key))) {
    throw new Error("AppearanceFields YAML: неизвестное поле строкового значения")
  }

  const { Тип: type, Значение: value, ...serviceFields } = record
  const hasValue = Object.prototype.hasOwnProperty.call(record, "Значение")

  if (type === "Поле") {
    if (!hasValue || typeof value !== "string") {
      throw new Error("AppearanceFields YAML: Поле требует строковое Значение")
    }
    return { ...serviceFields, Тип: "Поле", Значение: value }
  }
  if (type === "ФорматированнаяСтрока") {
    const items = assertLanguageMap(value)
    return {
      ...serviceFields,
      Тип: "МногоязычнаяФорматированнаяСтрока",
      Значение: { Форматированный: "Истина", Текст: items },
    }
  }
  if (type !== undefined) {
    throw new Error("AppearanceFields YAML: неизвестный Тип строкового значения")
  }
  if (!hasValue) return { ...serviceFields, Значение: undefined }
  if (value === null || typeof value === "string") return { ...serviceFields, Значение: value }
  return { ...serviceFields, Тип: "МногоязычнаяСтрока", Значение: assertLanguageMap(value) }
}

export const normalizeAppearanceFieldsStringYAML = (yaml: unknown): unknown => {
  const record = asRecord(yaml)
  if (record === undefined) return yaml
  const normalized = { ...record }
  for (const key of stringPropertyKeys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) normalized[key] = normalizeStringParameter(record[key])
  }
  return normalized
}
