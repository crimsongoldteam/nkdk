import { readFileSync } from "node:fs"
import type { ScenarioOperation } from "../types"

const path = "Конфигурация.yaml"
const before = readFileSync(new URL("../../../fixtures/nkdk/cfe/Расширение_All/Конфигурация.yaml", import.meta.url), "utf8")
const commentChanged = replaceOnce(before, "Комментарий: Комментарий", "Комментарий: Проверка partial sync")
const interfaceChanged = replaceOnce(commentChanged, "Общее: Ложь", "Общее: Истина")

export const extensionConfigurationOperations: readonly ScenarioOperation[] = [
  operation("extension:configuration:comment", before, commentChanged),
  operation("extension:configuration:command-interface", commentChanged, interfaceChanged),
]

export const extensionConfigurationRestoreOperations = extensionConfigurationOperations.toReversed().map((source): ScenarioOperation => ({
  ...source,
  key: `${source.key}:restore`,
  changes: source.changes.map((change) => ({ path: change.path, before: change.after, after: change.before })),
}))

export const extensionConfigurationVerificationOperations: readonly ScenarioOperation[] = [
  operation("extension:configuration:companion-documents", before, commentChanged),
  operation("extension:configuration:companion-documents:restore", commentChanged, before),
]

function operation(key: string, source: string, target: string): ScenarioOperation {
  return { key, kind: "change", changes: [{ path, before: source, after: target }], dependsOn: [] }
}

function replaceOnce(source: string, oldValue: string, newValue: string): string {
  const index = source.indexOf(oldValue)
  if (index < 0 || source.indexOf(oldValue, index + oldValue.length) >= 0) throw new Error(`Не найден фрагмент расширения ${oldValue}`)
  return `${source.slice(0, index)}${newValue}${source.slice(index + oldValue.length)}`
}
