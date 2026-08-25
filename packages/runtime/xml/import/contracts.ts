export type ImportContentFromXMLOptions = {
  preserveXsiNil?: true
  preserveEmptyElements?: true
  preserveEmptyElementNames?: readonly string[]
}

export type {
  XmlAttributeNode,
  XmlAddressedNode,
  XmlContentNode,
  XmlDocument,
  XmlDocumentContentNode,
  XmlElementNode,
  XmlProcessingInstructionNode,
  XmlSourceSpan,
  XmlTextNode,
} from "./document"
