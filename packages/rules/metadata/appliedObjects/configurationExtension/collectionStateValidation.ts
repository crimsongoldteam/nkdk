import { join } from "node:path"
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
    filePath: join(params.projectDir, ...params.projectPath.split("/")),
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
