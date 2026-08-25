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
    && "compatibilityValue" in value
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
