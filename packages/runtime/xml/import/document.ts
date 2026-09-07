export interface XmlSourceSpan {
  readonly start: number
  readonly end: number
}

export interface XmlAddressedNode {
  readonly id: number
  readonly occurrence: number
  readonly path: string
  readonly span: XmlSourceSpan
}

export interface XmlAttributeNode extends XmlAddressedNode {
  readonly name: string
  readonly value: string
}

export interface XmlTextNode extends XmlAddressedNode {
  readonly type: "text"
  readonly value: string
}

export interface XmlProcessingInstructionNode extends XmlAddressedNode {
  readonly type: "processingInstruction"
  readonly target: string
  readonly body: string
  readonly attributes: readonly XmlAttributeNode[]
}

export type XmlContentNode = XmlElementNode | XmlTextNode | XmlProcessingInstructionNode

export type XmlDocumentContentNode = XmlContentNode

export interface XmlElementNode extends XmlAddressedNode {
  readonly type: "element"
  readonly name: string
  readonly attributes: readonly XmlAttributeNode[]
  readonly content: readonly XmlContentNode[]
  readonly structuralHash: bigint
  readonly compatibilityValue: unknown
}

export interface XmlDocument {
  readonly content: readonly XmlDocumentContentNode[]
  readonly roots: readonly XmlElementNode[]
  readonly compatibility: Readonly<Record<string, unknown>>
  readonly sourceLength: number
}

export function isXmlElementNode(value: unknown): value is XmlElementNode {
  return value !== null
    && typeof value === "object"
    && "type" in value
    && value.type === "element"
    && "name" in value && typeof value.name === "string"
    && "id" in value && typeof value.id === "number"
    && "attributes" in value && Array.isArray(value.attributes)
    && "content" in value && Array.isArray(value.content)
}

export function xmlAttributeValue(node: XmlElementNode, name: string): string | undefined {
  return node.attributes.find(attribute => attribute.name === name)?.value
}

/** Пустой текст не является значением; атрибуты, дочерние элементы и PI — являются. */
export function isEmptyXmlElement(node: XmlElementNode): boolean {
  return node.attributes.length === 0
    && node.content.every(child => child.type === "text" && child.value === "")
}

/** Пустой элемент или текст без атрибутов, дочерних элементов и PI. */
export function isPlainXmlTextElement(node: XmlElementNode): boolean {
  return node.attributes.length === 0 && node.content.every(child => child.type === "text")
}

/** Только непосредственный текст; наличие элемента проверяется отдельно. */
export function xmlTextValue(node: XmlElementNode): string {
  let text = ""
  for (const child of node.content) {
    if (child.type === "text") text += child.value
  }
  return text
}

export function xmlElementChildren(
  node: XmlElementNode,
  name?: string,
): XmlElementNode[] {
  return node.content.filter(
    (child): child is XmlElementNode =>
      child.type === "element" && (name === undefined || child.name === name),
  )
}

/** Промежуточные родители единственны; последний элемент может повторяться. */
export function xmlElementsAtUniquePath(
  roots: readonly XmlElementNode[],
  path: readonly string[],
): readonly XmlElementNode[] {
  let nodes = roots
  for (let index = 0; index < path.length; index++) {
    nodes = nodes.filter(node => node.name === path[index])
    if (index === path.length - 1) break
    if (nodes.length !== 1) return []
    nodes = xmlElementChildren(nodes[0]!)
  }
  return nodes
}
