import {
  copyYAMLRuntimeMetadata,
  markYAMLScalarTag,
  yamlScalarTagAt,
} from "@nkdk/runtime"

export interface ExtensionPropertyItem {
  readonly metadata: string
  readonly state: "Check" | "Modify"
}

export function joinExchangePlanExtensionContent(
  items: readonly Readonly<Record<string, unknown>>[],
  states: readonly ExtensionPropertyItem[],
): Record<string, unknown>[] {
  const itemByMetadata = uniqueByMetadata(items, "состава")
  const stateByMetadata = uniqueStates(states)
  for (const { metadata, state } of states) {
    if (state !== "Check" && state !== "Modify") {
      throw new Error(`Для элемента состава «${metadata}» задан неизвестный State: ${String(state)}`)
    }
  }
  for (const metadata of itemByMetadata.keys()) {
    if (!stateByMetadata.has(metadata)) {
      throw new Error(`Для элемента состава «${metadata}» не задан режим ExtensionProperty`)
    }
  }
  return states.map(({ metadata, state }) => {
    const source = itemByMetadata.get(metadata)
    const item = source === undefined
      ? { Метаданные: metadata, Использовать: "Ложь" }
      : cloneItem(source)
    if (state === "Modify") markYAMLScalarTag(item, "Метаданные", "изменять")
    return item
  })
}

export function splitExchangePlanExtensionContent(
  yaml: readonly Readonly<Record<string, unknown>>[],
): {
  readonly items: readonly Record<string, unknown>[]
  readonly states: readonly ExtensionPropertyItem[]
} {
  uniqueByMetadata(yaml, "YAML")
  const items: Record<string, unknown>[] = []
  const states: ExtensionPropertyItem[] = []
  for (const source of yaml) {
    const metadata = metadataOf(source)
    const tag = yamlScalarTagAt(source, "Метаданные")
    if (tag === "проверять") {
      throw new Error(`Элемент состава «${metadata}» не поддерживает режим !проверять`)
    }
    states.push({ metadata, state: tag === "изменять" ? "Modify" : "Check" })
    const use = source.Использовать
    if (use !== undefined && use !== "Ложь") {
      throw new Error(`Использовать у элемента «${metadata}» допускает только значение Ложь`)
    }
    if (use === "Ложь") {
      if (Object.prototype.hasOwnProperty.call(source, "Авторегистрация")) {
        throw new Error(`Авторегистрация недопустима у выключенного элемента «${metadata}»`)
      }
      continue
    }
    const item = cloneItem(source)
    delete item.Использовать
    items.push(item)
  }
  return { items, states }
}

function uniqueByMetadata(
  items: readonly Readonly<Record<string, unknown>>[],
  collectionName: string,
): Map<string, Readonly<Record<string, unknown>>> {
  const result = new Map<string, Readonly<Record<string, unknown>>>()
  for (const item of items) {
    const metadata = metadataOf(item)
    if (result.has(metadata)) throw new Error(`В ${collectionName} найден дубликат Metadata «${metadata}»`)
    result.set(metadata, item)
  }
  return result
}

function uniqueStates(states: readonly ExtensionPropertyItem[]): Map<string, ExtensionPropertyItem> {
  const result = new Map<string, ExtensionPropertyItem>()
  for (const state of states) {
    if (result.has(state.metadata)) {
      throw new Error(`В ExtensionProperty найден дубликат Metadata «${state.metadata}»`)
    }
    result.set(state.metadata, state)
  }
  return result
}

function metadataOf(item: Readonly<Record<string, unknown>>): string {
  const metadata = item.Метаданные
  if (typeof metadata !== "string" || metadata.length === 0) {
    throw new Error("Элемент состава должен содержать Метаданные")
  }
  return metadata
}

function cloneItem(source: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const target = { ...source }
  copyYAMLRuntimeMetadata(source, target)
  return target
}
