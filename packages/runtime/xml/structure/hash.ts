import { xxh3 } from "@node-rs/xxhash"
import type {
  XmlAttributeNode,
  XmlElementNode,
  XmlTextNode,
} from "../import/document"

export type XmlStructuralAttribute = Pick<XmlAttributeNode, "name" | "value">

export interface XmlStructuralProcessingInstruction {
  readonly type: "processingInstruction"
  readonly target: string
  readonly body: string
  readonly attributes: readonly XmlStructuralAttribute[]
}

export type XmlStructuralContent =
  | Pick<XmlTextNode, "type" | "value">
  | Pick<XmlElementNode, "type" | "structuralHash">
  | XmlStructuralProcessingInstruction

export interface XmlElementStructure {
  readonly name: string
  readonly attributes: readonly XmlStructuralAttribute[]
  readonly content: readonly XmlStructuralContent[]
}

const encoder = new TextEncoder()

export function hashXmlElementStructure(element: XmlElementStructure): bigint {
  const hash = xxh3.Xxh3.withSeed()
  writeByte(hash, 1)
  writeString(hash, element.name)
  writeUnsignedInteger(hash, element.attributes.length)
  for (const attribute of element.attributes) writeAttribute(hash, attribute)
  writeUnsignedInteger(hash, element.content.length)
  for (const node of element.content) writeContent(hash, node)
  return hash.digest()
}

type Xxh3Stream = ReturnType<typeof xxh3.Xxh3.withSeed>

function writeContent(hash: Xxh3Stream, node: XmlStructuralContent): void {
  switch (node.type) {
    case "text":
      writeByte(hash, 2)
      writeString(hash, node.value)
      return
    case "element":
      writeByte(hash, 3)
      writeBigUnsignedInteger(hash, node.structuralHash)
      return
    case "processingInstruction":
      writeProcessingInstruction(hash, node)
  }
}

function writeProcessingInstruction(
  hash: Xxh3Stream,
  node: XmlStructuralProcessingInstruction
): void {
  writeByte(hash, 4)
  writeString(hash, node.target)
  writeString(hash, node.body)
  writeUnsignedInteger(hash, node.attributes.length)
  for (const attribute of node.attributes) writeAttribute(hash, attribute)
}

function writeAttribute(hash: Xxh3Stream, attribute: XmlStructuralAttribute): void {
  writeString(hash, attribute.name)
  writeString(hash, attribute.value)
}

function writeString(hash: Xxh3Stream, value: string): void {
  const bytes = encoder.encode(value)
  writeUnsignedInteger(hash, bytes.length)
  hash.update(bytes)
}

function writeUnsignedInteger(hash: Xxh3Stream, value: number): void {
  const bytes = new Uint8Array(4)
  new DataView(bytes.buffer).setUint32(0, value, true)
  hash.update(bytes)
}

function writeBigUnsignedInteger(hash: Xxh3Stream, value: bigint): void {
  const bytes = new Uint8Array(8)
  new DataView(bytes.buffer).setBigUint64(0, value, true)
  hash.update(bytes)
}

function writeByte(hash: Xxh3Stream, value: number): void {
  hash.update(Uint8Array.of(value))
}
