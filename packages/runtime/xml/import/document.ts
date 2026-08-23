export interface XmlSourceSpan {
  readonly start: number
  readonly end: number
}

export interface XmlAttributeNode {
  readonly name: string
  readonly value: string
}

export interface XmlTextNode {
  readonly type: "text"
  readonly value: string
}

export interface XmlProcessingInstructionNode {
  readonly type: "processingInstruction"
  readonly target: string
  readonly attributes: readonly XmlAttributeNode[]
}

export type XmlContentNode = XmlElementNode | XmlTextNode | XmlProcessingInstructionNode

export interface XmlElementNode {
  readonly type: "element"
  readonly id: number
  readonly name: string
  readonly occurrence: number
  readonly path: string
  readonly attributes: readonly XmlAttributeNode[]
  readonly content: readonly XmlContentNode[]
  readonly span: XmlSourceSpan
  readonly structuralHash: bigint
  readonly compatibilityValue: unknown
}

export interface XmlDocument {
  readonly roots: readonly XmlElementNode[]
  readonly compatibility: Readonly<Record<string, unknown>>
  readonly sourceLength: number
}
