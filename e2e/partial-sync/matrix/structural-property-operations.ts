import { replaceText } from "./change-builders"
import { terminalOwnerYaml } from "./children"
import { matrixObjectNames } from "./root-objects"
import type { ScenarioFileChange, ScenarioOperation } from "./types"

const currentByOwner = new Map<string, { readonly path: string, contents: string }>()

export const structuralPropertyOperations = [
  replaceOwnerFragment({
    key: "structural:catalog-attribute-length",
    ownerKey: "object:catalog",
    targetKey: "child:catalog:attributes",
    before: "  ПроверочныйРеквизит:\n    Комментарий: До изменения\n    Тип: Строка(10)\n",
    after: "  ПроверочныйРеквизит:\n    Комментарий: До изменения\n    Тип: Строка(20)\n",
  }),
  replaceOwnerFragment({
    key: "structural:document-attribute-type",
    ownerKey: "object:document",
    targetKey: "child:document:attributes",
    before: "  ПроверочныйРеквизит:\n    Комментарий: До изменения\n    Тип: Строка(10)\n",
    after: `  ПроверочныйРеквизит:\n    Комментарий: До изменения\n    Тип: Справочник.${matrixObjectNames.catalog}\n`,
  }),
  replaceOwnerFragment({
    key: "structural:task-attribute-required",
    ownerKey: "object:task",
    targetKey: "child:task:attributes",
    before: "  ПроверочныйРеквизит:\n    Комментарий: До изменения\n    Тип: Строка(10)\n",
    after: [
      "  ПроверочныйРеквизит:",
      "    Комментарий: До изменения",
      "    Тип: Строка(10)",
      "    ПроверкаЗаполнения: ВыдаватьОшибку",
      "",
    ].join("\n"),
  }),
  replaceOwnerFragment({
    key: "structural:information-register-dimension-index",
    ownerKey: "object:information-register",
    targetKey: "child:information-register:dimensions",
    before: [
      "  ПроверочноеИзмерение:",
      "    Комментарий: До изменения",
      "    Тип: Строка(10)",
      "",
    ].join("\n"),
    after: [
      "  ПроверочноеИзмерение:",
      "    Комментарий: До изменения",
      "    Тип: Строка(10)",
      "    Индексирование: Индексировать",
      "",
    ].join("\n"),
  }),
  replaceOwnerFragment({
    key: "structural:document-register-link",
    ownerKey: "object:document",
    targetKey: "object:information-register",
    before: `Движения:\n  - РегистрНакопления.${matrixObjectNames.accumulationRegister}\n`,
    after: [
      "Движения:",
      `  - РегистрНакопления.${matrixObjectNames.accumulationRegister}`,
      `  - РегистрСведений.${matrixObjectNames.informationRegister}`,
      "",
    ].join("\n"),
  }),
  insertOwnerSection({
    key: "structural:task-business-process-link",
    ownerKey: "object:task",
    targetKey: "object:business-process",
    sectionKey: "ВводитсяНаОсновании",
    section: `ВводитсяНаОсновании:\n  - БизнесПроцесс.${matrixObjectNames.businessProcess}\n`,
  }),
] as const satisfies readonly ScenarioOperation[]

type ReplaceOwnerFragmentParams = {
  readonly key: string
  readonly ownerKey: string
  readonly targetKey: string
  readonly before: string
  readonly after: string
}

function replaceOwnerFragment(params: ReplaceOwnerFragmentParams): ScenarioOperation {
  const owner = currentOwner(params.ownerKey)
  const change = replaceText({
    path: owner.path,
    contents: owner.contents,
    before: params.before,
    after: params.after,
  })
  updateOwner(params.ownerKey, change)
  return changeOperation(params.key, params.targetKey, change)
}

type InsertOwnerSectionParams = {
  readonly key: string
  readonly ownerKey: string
  readonly targetKey: string
  readonly sectionKey: string
  readonly section: string
}

function insertOwnerSection(params: InsertOwnerSectionParams): ScenarioOperation {
  const owner = currentOwner(params.ownerKey)
  const anchor = [...owner.contents.matchAll(/^(\S[^:\r\n]*):/gmu)]
    .find((match) => (match[1] ?? "").localeCompare(params.sectionKey, "ru") > 0)
  const index = anchor?.index ?? owner.contents.length
  const separator = index === owner.contents.length && !owner.contents.endsWith("\n") ? "\n" : ""
  const after = `${owner.contents.slice(0, index)}${separator}${params.section}${owner.contents.slice(index)}`
  const change = { path: owner.path, before: owner.contents, after } satisfies ScenarioFileChange
  updateOwner(params.ownerKey, change)
  return changeOperation(params.key, params.targetKey, change)
}

function currentOwner(ownerKey: string): { readonly path: string, contents: string } {
  const existing = currentByOwner.get(ownerKey)
  if (existing !== undefined) return existing
  const initial = terminalOwnerYaml(ownerKey)
  currentByOwner.set(ownerKey, initial)
  return initial
}

function updateOwner(ownerKey: string, change: ScenarioFileChange): void {
  if (typeof change.after !== "string") throw new Error(`Структурное изменение ${ownerKey} не текстовое`)
  currentByOwner.set(ownerKey, { path: change.path, contents: change.after })
}

function changeOperation(
  key: string,
  targetKey: string,
  change: ScenarioFileChange,
): ScenarioOperation {
  return { key, kind: "change", targetKey, changes: [change], dependsOn: [targetKey] }
}
