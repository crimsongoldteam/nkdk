import { markYAMLValueTag, yamlValueTag } from "@nkdk/runtime"

export function importPredefinedExtensionState(
  source: Readonly<Record<string, unknown>>,
  yaml: Record<string, unknown>,
): void {
  const state = source.ExtensionState
  if (state === undefined || state === "AdoptedCheck") return
  if (state === "AdoptedNotify") {
    markYAMLValueTag(yaml, "проверять")
    return
  }
  throw new Error(`Неизвестный ExtensionState предопределённого элемента: ${String(state)}`)
}

export function exportPredefinedExtensionState(params: {
  readonly yaml: Readonly<Record<string, unknown>>
  readonly borrowed: boolean
}): "AdoptedCheck" | "AdoptedNotify" | undefined {
  const tag = yamlValueTag(params.yaml)
  if (tag === "изменять") {
    throw new Error("Предопределённый элемент расширения не поддерживает режим !изменять")
  }
  if (tag === "проверять" && !params.borrowed) {
    throw new Error("Собственный предопределённый элемент не поддерживает режим !проверять")
  }
  if (!params.borrowed) return undefined
  return tag === "проверять" ? "AdoptedNotify" : "AdoptedCheck"
}
