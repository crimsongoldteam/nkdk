import { preparedXMLDependencyFacts } from "@nkdk/runtime/rule-kit"
import { isXmlElementNode, objectRecordOrUndefined, xmlElementChildren, xmlTextValue } from "@nkdk/runtime"

export function hasSoleValueListType(xml: unknown): boolean {
  if (isXmlElementNode(xml)) {
    const types = xmlElementChildren(xml, "Type")
    if (types.length !== 1) return false
    const values = xmlElementChildren(types[0]!, "v8:Type")
    return values.length === 1 && values[0]!.attributes.length === 0
      && values[0]!.content.every(node => node.type === "text") && xmlTextValue(values[0]!) === "v8:ValueListType"
  }
  const type = objectRecordOrUndefined(xml)?.Type
  if (type === null || typeof type !== "object" || Array.isArray(type)) return false
  const raw = (type as Record<string, unknown>)["v8:Type"]
  const values = Array.isArray(raw) ? raw : raw === undefined ? [] : [raw]
  return values.length === 1 && values[0] === "v8:ValueListType"
}

export function formAttributeValueTypeDefault({ yaml, operation }: {
  readonly yaml?: unknown
  readonly operation: string
}): { type: [] } | undefined {
  if (operation !== "importFromYAML" || yaml === null || typeof yaml !== "object" || Array.isArray(yaml)) return undefined
  const item = yaml as Record<string, unknown>
  const facts = preparedXMLDependencyFacts(yaml)
  const type = facts === undefined ? item.Тип : facts.item.Тип
  if (
    type === "СписокЗначений" &&
    !Object.prototype.hasOwnProperty.call(item, "ТипЗначения")
  ) {
    return { type: [] }
  }
  return undefined
}
