import type { Diagnostic } from "@nkdk/runtime"
import type { ProjectStateStructuredDocumentEntry } from "../../projectState/contracts/fileUpdate"

type CollectionMode = "control" | "notify" | "extend"
type TaggedFactValue = { readonly mode: CollectionMode; readonly value: unknown }

export function validatePredefinedCollectionState(params: {
  readonly projectDir: string
  readonly projectPath: string
  readonly entry: ProjectStateStructuredDocumentEntry
  readonly extension: unknown
  readonly base: unknown
}): readonly Diagnostic[] {
  return validateCollection({
    ...params,
    extension: asRecord(params.extension),
    base: asRecord(params.base),
    path: params.entry.yamlPath,
  })
}

interface ExchangePlanContentFactItem {
  readonly metadata: string
  readonly mode: "control" | "extend"
  readonly used: boolean
  readonly autoRecord: unknown
  readonly invalidUse: boolean
}

export function validateExchangePlanContentState(params: {
  readonly projectDir: string
  readonly projectPath: string
  readonly entry: ProjectStateStructuredDocumentEntry
  readonly extension: unknown
  readonly base: unknown
  readonly baseTargetExists?: (metadata: string) => boolean
}): readonly Diagnostic[] {
  const extension = exchangeItems(params.extension)
  const baseByMetadata = new Map(exchangeItems(params.base).map((item) => [item.metadata, item]))
  const diagnostics: Diagnostic[] = []
  extension.forEach((item, index) => {
    const usePath = [...params.entry.yamlPath, index, "Использовать"]
    if (item.mode === "extend") {
      if (!item.used && !item.invalidUse) {
        diagnostics.push(diagnostic(params, usePath, "error",
          "Изменяемый элемент состава со снятым флажком требует !xml/invalid"))
      } else if (item.used && item.invalidUse) {
        diagnostics.push(diagnostic(params, usePath, "error", "Лишний !xml/invalid у допустимого элемента состава"))
      }
      return
    }
    if (item.invalidUse) {
      diagnostics.push(diagnostic(params, usePath, "error", "Лишний !xml/invalid у контролируемого элемента состава"))
      return
    }
    const base = baseByMetadata.get(item.metadata) ?? (
      params.baseTargetExists?.(item.metadata) === true
        ? { ...item, used: false, autoRecord: "Разрешить", invalidUse: false }
        : undefined
    )
    if (base === undefined) return
    if (item.used === base.used && (!item.used || item.autoRecord === base.autoRecord)) return
    diagnostics.push(diagnostic(params, [...params.entry.yamlPath, index], "error",
      `Контролируемый элемент состава «${item.metadata}» отличается от основной конфигурации`))
  })
  return diagnostics
}

function validateCollection(params: {
  readonly projectDir: string
  readonly projectPath: string
  readonly entry: ProjectStateStructuredDocumentEntry
  readonly extension: Readonly<Record<string, unknown>>
  readonly base: Readonly<Record<string, unknown>>
  readonly path: readonly (string | number)[]
}): Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  for (const [name, rawExtensionItem] of Object.entries(params.extension)) {
    const tagged = taggedValue(rawExtensionItem)
    const extensionItem = asRecord(tagged.value)
    const rawBaseItem = params.base[name]
    const itemPath = [...params.path, name]
    if (rawBaseItem === undefined) {
      if (tagged.explicit) {
        diagnostics.push(diagnostic(params, itemPath, "error",
          `Заимствованный предопределённый элемент «${name}» отсутствует в основной конфигурации`))
      }
      continue
    }
    if (tagged.mode === "extend") {
      diagnostics.push(diagnostic(params, itemPath, "error",
        `Предопределённый элемент «${name}» не поддерживает режим !изменять`))
      continue
    }
    const baseItem = asRecord(taggedValue(rawBaseItem).value)
    const extensionFields = withoutChildren(extensionItem)
    const baseFields = withoutChildren(baseItem)
    if (!sameValue(extensionFields, baseFields)) {
      const severity = tagged.mode === "notify" ? "warning" : "error"
      diagnostics.push(diagnostic(params, itemPath, severity,
        severity === "warning"
          ? `Проверяемый предопределённый элемент «${name}» отличается от основной конфигурации`
          : `Контролируемый предопределённый элемент «${name}» отличается от основной конфигурации`))
    }
    diagnostics.push(...validateCollection({
      ...params,
      extension: asRecord(extensionItem.Элементы),
      base: asRecord(baseItem.Элементы),
      path: [...itemPath, "Элементы"],
    }))
  }
  return diagnostics
}

function taggedValue(value: unknown): { mode: CollectionMode; value: unknown; explicit: boolean } {
  if (!isTaggedFactValue(value)) return { mode: "control", value, explicit: false }
  return { mode: value.mode, value: value.value, explicit: true }
}

function isTaggedFactValue(value: unknown): value is TaggedFactValue {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return (record.mode === "control" || record.mode === "notify" || record.mode === "extend")
    && Object.prototype.hasOwnProperty.call(record, "value")
    && Object.keys(record).every((key) => key === "mode" || key === "value")
}

function withoutChildren(value: Readonly<Record<string, unknown>>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "Элементы"))
}

function asRecord(value: unknown): Readonly<Record<string, unknown>> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Readonly<Record<string, unknown>>
    : {}
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function diagnostic(
  params: { readonly projectDir: string; readonly projectPath: string },
  path: readonly (string | number)[],
  severity: "error" | "warning",
  message: string,
): Diagnostic {
  return {
    filePath: params.projectPath,
    line: 1,
    col: 1,
    severity,
    source: "cross-file",
    message,
    path: `/${path.map(escapePointer).join("/")}`,
  }
}

function escapePointer(value: string | number): string {
  return String(value).replace(/~/g, "~0").replace(/\//g, "~1")
}

function exchangeItems(value: unknown): ExchangePlanContentFactItem[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) return []
    const record = item as Record<string, unknown>
    if (typeof record.metadata !== "string") return []
    if (record.mode !== "control" && record.mode !== "extend") return []
    return [{
      metadata: record.metadata,
      mode: record.mode,
      used: record.used === true,
      autoRecord: record.autoRecord,
      invalidUse: record.invalidUse === true,
    }]
  })
}
