import { isXmlElementNode, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"

/** Индексы только посещённых контейнеров, живущие в рамках одного дополнения. */
export class ImportSourceReader {
  private readonly children = new Map<XmlElementNode, Map<string, XmlElementNode | XmlElementNode[]>>()

  property(source: unknown, name: string): unknown {
    return isXmlElementNode(source) ? this.index(source).get(name) : importSourceProperty(source, name)
  }

  hasProperty(source: unknown, name: string): boolean {
    return isXmlElementNode(source) ? this.index(source).has(name) : importSourceHasProperty(source, name)
  }

  private index(source: XmlElementNode): Map<string, XmlElementNode | XmlElementNode[]> {
    const cached = this.children.get(source)
    if (cached !== undefined) return cached
    const children = new Map<string, XmlElementNode | XmlElementNode[]>()
    for (const child of source.content) {
      if (child.type !== "element") continue
      const previous = children.get(child.name)
      if (previous === undefined) children.set(child.name, child)
      else if (Array.isArray(previous)) previous.push(child)
      else children.set(child.name, [previous, child])
    }
    this.children.set(source, children)
    return children
  }
}

/** Возвращает выбранные узлы, не восстанавливая XML-объект. */
export function importSourceProperty(source: unknown, name: string): unknown {
  if (isXmlElementNode(source)) {
    const children = xmlElementChildren(source, name)
    return children.length > 1 ? children : children[0]
  }
  return source !== null && typeof source === "object" && !Array.isArray(source)
    ? (source as Record<string, unknown>)[name]
    : undefined
}

export function importSourceHasProperty(source: unknown, name: string): boolean {
  return isXmlElementNode(source)
    ? source.content.some(child => child.type === "element" && child.name === name)
    : source !== null && typeof source === "object" && !Array.isArray(source) && Object.hasOwn(source, name)
}

/** Служебные перечисления имеют простой текст, а не типизированный объект. */
export function importSourceScalar(value: unknown): unknown {
  if (!isXmlElementNode(value)) return value
  return value.attributes.length === 0 && value.content.every(child => child.type === "text")
    ? xmlTextValue(value) || undefined
    : value
}
