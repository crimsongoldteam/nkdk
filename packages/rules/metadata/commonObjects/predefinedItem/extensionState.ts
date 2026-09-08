import { isXmlElementNode, markYAMLValueTag, xmlElementChildren, xmlTextValue, yamlValueTag, type XmlElementNode } from "@nkdk/runtime"

export function importPredefinedExtensionState(
  source: Readonly<Record<string, unknown>> | XmlElementNode,
  yaml: Record<string, unknown>,
): void {
  const states = isXmlElementNode(source) ? xmlElementChildren(source, "ExtensionState") : undefined
  const stateNode = states?.[0]
  const state = isXmlElementNode(source)
    ? states!.length > 1 ? states!.map(node => xmlTextValue(node) || undefined)
      : stateNode === undefined ? undefined : xmlTextValue(stateNode) || undefined
    : source.ExtensionState
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
