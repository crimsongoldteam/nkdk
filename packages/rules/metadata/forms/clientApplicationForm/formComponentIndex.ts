export interface FormComponentEntry {
  readonly name: string
  readonly path: string
}

export interface ClientApplicationFormComponentIndex {
  readonly elements: ReadonlyMap<string, FormComponentEntry>
  readonly attributes: ReadonlyMap<string, FormComponentEntry>
  readonly commands: ReadonlyMap<string, FormComponentEntry>
  readonly parameters: ReadonlyMap<string, FormComponentEntry>
}

export class FormComponentIndexError extends Error {
  readonly path: string

  constructor(message: string, path: string) {
    super(message)
    this.path = path
  }
}

export function indexClientApplicationFormComponents(yaml: unknown): ClientApplicationFormComponentIndex {
  return {
    elements: indexElements(yaml),
    ...indexClientApplicationFormNamedComponents(yaml),
  }
}

export function indexClientApplicationFormNamedComponents(yaml: unknown): Omit<ClientApplicationFormComponentIndex, "elements"> {
  const root = record(yaml)
  return {
    attributes: indexNamed(root?.Реквизиты, "Реквизиты"),
    commands: indexNamed(root?.Команды, "Команды"),
    parameters: indexNamed(root?.Параметры, "Параметры"),
  }
}

export function acceptClientApplicationFormElementComponent(result: Map<string, FormComponentEntry>, name: string, path: string): void {
  if (name.length === 0) throw new FormComponentIndexError("Имя элемента формы не может быть пустым", path)
  if (result.has(name)) throw new FormComponentIndexError(`Повтор имени элемента «${name}»`, path)
  result.set(name, { name, path })
}

function indexElements(yaml: unknown): ReadonlyMap<string, FormComponentEntry> {
  const result = new Map<string, FormComponentEntry>()
  collectFormDataPathOccurrencesFromYAML({
    yaml,
    rule: ClientApplicationFormRules,
    resolveCollectionItemRule: resolveClientApplicationFormCollectionItemRule,
    visitElement({ name, yamlPath, rule }) {
      if (!("enterpriseField" in rule) || !("enterpriseFieldType" in rule)) return
      const path = yamlPath.map(String).join(".")
      acceptClientApplicationFormElementComponent(result, name, path)
    },
  })
  return result
}

function indexNamed(value: unknown, path: string): ReadonlyMap<string, FormComponentEntry> {
  const result = new Map<string, FormComponentEntry>()
  if (value === undefined) return result
  const collection = record(value)
  if (collection === undefined) throw new FormComponentIndexError(`Некорректная коллекция «${path}»`, path)
  for (const name of Object.keys(collection)) result.set(name, { name, path: `${path}.${name}` })
  return result
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}
import { collectFormDataPathOccurrencesFromYAML } from "../../validation/dataPath/formYamlTraversal"
import { resolveClientApplicationFormCollectionItemRule } from "./formDataPathProjection"
import { ClientApplicationFormRules } from "./rules"
