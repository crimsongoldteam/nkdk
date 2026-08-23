export type ImportContentFromXMLOptions = {
  preserveXsiNil?: true
  preserveEmptyElements?: true
  preserveEmptyElementNames?: readonly string[]
}

export type {
  XmlAttributeNode,
  XmlContentNode,
  XmlDocument,
  XmlElementNode,
  XmlProcessingInstructionNode,
  XmlSourceSpan,
  XmlTextNode,
} from "./document"
