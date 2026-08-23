import type { CatalogReport, FillValueSummaryRow } from "./aggregate"
import type { NormalizedType, ValueCategory } from "./model"

const families: readonly [NormalizedType["family"], string][] = [
  ["string", "Строки"],
  ["number", "Числа"],
  ["boolean", "Булево"],
  ["dateTime", "Дата и время"],
  ["reference", "Ссылки"],
  ["composite", "Составные типы"],
  ["unresolved", "Тип не определён"],
]

const categoryLabels: Readonly<Record<ValueCategory, string>> = {
  absent: "Отсутствует",
  xmlEmpty: "Пустое XML",
  initial: "Начальное значение",
  explicit: "Явное значение",
  emptyRef: "Пустая ссылка",
  predefinedRef: "Предопределённое значение",
  enumValue: "Значение перечисления",
  concreteRef: "Конкретная ссылка",
  invalid: "Несовместимое значение",
  unparsed: "Не разобрано",
}

export function renderCatalogMarkdown(report: CatalogReport): string {
  const lines = [
    "# Значения заполнения по типам",
    "",
    `- Наблюдений: ${report.counts.observations}`,
    `- Уникальных точных вариантов: ${report.counts.exactValues}`,
    `- Конфигураций: ${report.counts.configurations}`,
    `- Неразобранных конструкций: ${report.counts.unresolved}`,
  ]

  for (const [family, title] of families) {
    const rows = report.summary.filter((row) => row.typeFamily === family)
    if (rows.length === 0) continue
    lines.push(
      "",
      `## ${title}`,
      "",
      "| Тип | Категория | Реквизит | XML-форма | Случаев | Значений | Баз | Состояние | Примеры значений | Примеры XML |",
      "|---|---|---|---|---:|---:|---:|---|---|---|",
      ...rows.map(renderSummaryRow),
    )
  }

  lines.push("", "## Неразобранное", "")
  if (report.unresolved.length === 0) {
    lines.push("Неразобранных XML-конструкций нет.")
  } else {
    lines.push(
      "| Элемент | Причина | Случаев | Базы | Примеры XML |",
      "|---|---|---:|---|---|",
      ...report.unresolved.map((value) => `| ${cell(value.element)} | ${cell(value.reason)} | ${value.occurrences} | ${cell(value.configurations.join(", "))} | ${cell(value.examples.join("<br>"))} |`),
    )
  }

  return `${lines.join("\n")}\n`
}

function renderSummaryRow(row: FillValueSummaryRow): string {
  return [
    typeLabel(row.typeSignature),
    categoryLabels[row.valueCategory],
    attributeLabel(row),
    row.fillValueForm,
    String(row.occurrences),
    String(row.uniqueValues),
    String(row.configurations),
    row.status,
    row.exactValues.length === 0 ? "—" : row.exactValues.join("<br>"),
    row.examples.join("<br>"),
  ].map(cell).join(" | ").replace(/^/, "| ").replace(/$/, " |")
}

function attributeLabel(row: FillValueSummaryRow): string {
  if (row.attributeKind === "ordinary") return "Обычный"
  const identity = row.standardIdentity
  return identity === undefined
    ? "Стандартный"
    : `Стандартный: ${identity.ownerKind}.${identity.attributeName}`
}

function typeLabel(signature: string): string {
  if (signature === "dateTime(DateTime)") return "ДатаВремя (дата и время)"
  if (signature === "dateTime(Date)") return "ДатаВремя (дата)"
  if (signature === "dateTime(Time)") return "ДатаВремя (время)"
  const reference = /^reference\(([^.()]+)\.([^()]+)\)$/.exec(signature)
  if (reference !== null) return `${rootLabel(reference[1] ?? "")}.${reference[2] ?? ""}`
  if (signature === "string") return "Строка"
  if (signature === "number") return "Число"
  if (signature === "boolean") return "Булево"
  return signature
}

function rootLabel(root: string): string {
  return ({
    Catalog: "Справочник",
    Document: "Документ",
    Enum: "Перечисление",
    ExchangePlan: "ПланОбмена",
    ChartOfAccounts: "ПланСчетов",
    ChartOfCharacteristicTypes: "ПланВидовХарактеристик",
    ChartOfCalculationTypes: "ПланВидовРасчета",
    BusinessProcess: "БизнесПроцесс",
    Task: "Задача",
  } as Readonly<Record<string, string>>)[root] ?? root
}

function cell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\r", " ").replaceAll("\n", " ")
}
