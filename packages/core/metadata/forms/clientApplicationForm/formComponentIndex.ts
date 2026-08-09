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
  const root = record(yaml)
  const elements = new Map<string, FormComponentEntry>()
  visitElements(root?.Элементы, "Элементы", elements)
  return {
    elements,
    attributes: indexNamed(root?.Реквизиты, "Реквизиты"),
    commands: indexNamed(root?.Команды, "Команды"),
    parameters: indexNamed(root?.Параметры, "Параметры"),
  }
}

function visitElements(value: unknown, path: string, result: Map<string, FormComponentEntry>): void {
  if (value === undefined) return
  const collection = record(value)
  if (collection === undefined) throw new FormComponentIndexError("Некорректное дерево элементов формы", path)
  for (const [name, raw] of Object.entries(collection)) {
    const elementPath = `${path}.${name}`
    if (name.length === 0) throw new FormComponentIndexError("Имя элемента формы не может быть пустым", path)
    const element = record(raw)
    if (element === undefined) throw new FormComponentIndexError(`Некорректный элемент «${name}»`, elementPath)
    if (result.has(name)) throw new FormComponentIndexError(`Повтор имени элемента «${name}»`, elementPath)
    result.set(name, { name, path: elementPath })
    visitElements(element.Элементы, `${elementPath}.Элементы`, result)
  }
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
