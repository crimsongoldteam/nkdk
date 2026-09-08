import { xmlElementChildren, type XmlElementNode } from "@nkdk/runtime"

// Immutable source positions, independent of traversal order and import rollback.
const occurrences = new WeakMap<XmlElementNode, number>()

export function indexFormChildItemOccurrences(root: XmlElementNode): void {
  const names = new Map<string, number>()
  const visit = (node: XmlElementNode, parent?: XmlElementNode, grandparent?: XmlElementNode): void => {
    if (parent?.name === "ChildItems") {
      const name = node.attributes.find(attribute => attribute.name === "name")?.value
      if (name !== undefined) {
        const occurrence = names.get(name) ?? 0
        names.set(name, occurrence + 1)
        occurrences.set(node, occurrence)
        // Descendants of a raw node do not acquire semantic identities.
        if (occurrence > 0 || (node.name === "PictureField" && grandparent?.name === "ContextMenu")) return
      }
    }
    for (const child of xmlElementChildren(node)) visit(child, node, parent)
  }
  visit(root)
}

export function formChildItemOccurrence(node: XmlElementNode | undefined): number | undefined {
  return node === undefined ? undefined : occurrences.get(node)
}
