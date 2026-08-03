const stringPropertyKeys = ["Текст", "Формат"] as const
const expandedKeys = new Set([
  "Использовать",
  "Значение",
  "РежимОтображения",
  "ИдентификаторПользовательскойНастройки",
  "ПредставлениеПользовательскойНастройки",
])

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined

const normalizeRawStringValue = (value: unknown): { readonly type?: string; readonly value: unknown } => {
  if (value === null || typeof value === "string") return { value }

  const record = asRecord(value)
  if (record === undefined || "Тип" in record) {
    throw new Error("AppearanceFields YAML: Текст и Формат не допускают поле Тип")
  }
  if ("Форматированный" in record || "Текст" in record) {
    if (
      record.Форматированный !== "Истина" ||
      asRecord(record.Текст) === undefined ||
      Object.keys(record).some((key) => key !== "Форматированный" && key !== "Текст")
    ) {
      throw new Error("AppearanceFields YAML: неверная форматированная строка")
    }
    return { type: "МногоязычнаяФорматированнаяСтрока", value }
  }
  return { type: "МногоязычнаяСтрока", value }
}

const normalizeStringParameter = (yaml: unknown): unknown => {
  const record = asRecord(yaml)
  if (record !== undefined && "Тип" in record) {
    throw new Error("AppearanceFields YAML: Текст и Формат не допускают поле Тип")
  }
  const expanded = record !== undefined && Object.keys(record).some((key) => expandedKeys.has(key))
  if (expanded && !Object.prototype.hasOwnProperty.call(record, "Значение")) {
    throw new Error("AppearanceFields YAML: развёрнутая строка требует Значение")
  }

  const normalized = normalizeRawStringValue(expanded ? record!.Значение : yaml)
  if (expanded) {
    return {
      ...record,
      ...(normalized.type === undefined ? {} : { Тип: normalized.type }),
      Значение: normalized.value,
    }
  }
  if (normalized.type === undefined) {
    return normalized.value === null ? { Значение: null } : normalized.value
  }
  return { Тип: normalized.type, Значение: normalized.value }
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
