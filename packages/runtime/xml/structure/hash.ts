import { xxh3 } from "@node-rs/xxhash"
import { Buffer } from "node:buffer"
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
let xmlStructureHashUpdateCountValueForTests = 0

export function xmlStructureHashUpdateCountForTests(): number {
  return xmlStructureHashUpdateCountValueForTests
}

export function resetXmlStructureHashUpdateCountForTests(): void {
  xmlStructureHashUpdateCountValueForTests = 0
}

export function normalizeXmlElementContent<T extends XmlStructuralContent>(
  content: readonly T[]
): readonly T[] {
  const hasElement = content.some((node) => node.type === "element")
  const hasMeaningfulText = content.some(
    (node) => node.type === "text" && node.value.trim().length > 0
  )
  if (!hasElement || hasMeaningfulText) return content

  const normalized = content.filter(
    (node) => node.type !== "text" || node.value.trim().length > 0
  )
  return normalized.length === content.length ? content : normalized
}

export function hashXmlElementStructure(element: XmlElementStructure): bigint {
  const writer = new XmlStructureHashWriter(xmlElementStructureByteLength(element))
  writer.writeByte(1)
  writer.writeString(element.name)
  writer.writeUnsignedInteger(element.attributes.length)
  for (const attribute of element.attributes) writeAttribute(writer, attribute)
  writer.writeUnsignedInteger(element.content.length)
  for (const node of element.content) writeContent(writer, node)
  return writer.digest()
}

class XmlStructureHashWriter {
  readonly #bytes: Uint8Array
  readonly #view: DataView
  #length = 0

  constructor(byteLength: number) {
    this.#bytes = new Uint8Array(byteLength)
    this.#view = new DataView(this.#bytes.buffer)
  }

  writeByte(value: number): void {
    this.#bytes[this.#length] = value
    this.#length += 1
  }

  writeUnsignedInteger(value: number): void {
    this.#view.setUint32(this.#length, value, true)
    this.#length += 4
  }

  writeBigUnsignedInteger(value: bigint): void {
    this.#view.setBigUint64(this.#length, value, true)
    this.#length += 8
  }

  writeString(value: string): void {
    const encoded = encoder.encode(value)
    this.writeUnsignedInteger(encoded.byteLength)
    this.#bytes.set(encoded, this.#length)
    this.#length += encoded.byteLength
  }

  digest(): bigint {
    if (this.#length !== this.#bytes.byteLength) {
      throw new Error("Размер структурного XML-хэша вычислен неверно")
    }
    const hash = xxh3.Xxh3.withSeed()
    hash.update(this.#bytes)
    xmlStructureHashUpdateCountValueForTests += 1
    return hash.digest()
  }
}

function xmlElementStructureByteLength(element: XmlElementStructure): number {
  return 1
    + xmlStructureStringByteLength(element.name)
    + 4
    + element.attributes.reduce((total, attribute) => total + xmlStructureAttributeByteLength(attribute), 0)
    + 4
    + element.content.reduce((total, node) => total + xmlStructureContentByteLength(node), 0)
}

function xmlStructureContentByteLength(node: XmlStructuralContent): number {
  switch (node.type) {
    case "text":
      return 1 + xmlStructureStringByteLength(node.value)
    case "element":
      return 1 + 8
    case "processingInstruction":
      return 1
        + xmlStructureStringByteLength(node.target)
        + xmlStructureStringByteLength(node.body)
        + 4
        + node.attributes.reduce(
          (total, attribute) => total + xmlStructureAttributeByteLength(attribute),
          0,
        )
  }
}

function xmlStructureAttributeByteLength(attribute: XmlStructuralAttribute): number {
  return xmlStructureStringByteLength(attribute.name) + xmlStructureStringByteLength(attribute.value)
}

function xmlStructureStringByteLength(value: string): number {
  return 4 + Buffer.byteLength(value, "utf8")
}

function writeContent(writer: XmlStructureHashWriter, node: XmlStructuralContent): void {
  switch (node.type) {
    case "text":
      writer.writeByte(2)
      writer.writeString(node.value)
      return
    case "element":
      writer.writeByte(3)
      writer.writeBigUnsignedInteger(node.structuralHash)
      return
    case "processingInstruction":
      writeProcessingInstruction(writer, node)
  }
}

function writeProcessingInstruction(
  writer: XmlStructureHashWriter,
  node: XmlStructuralProcessingInstruction
): void {
  writer.writeByte(4)
  writer.writeString(node.target)
  writer.writeString(node.body)
  writer.writeUnsignedInteger(node.attributes.length)
  for (const attribute of node.attributes) writeAttribute(writer, attribute)
}

function writeAttribute(writer: XmlStructureHashWriter, attribute: XmlStructuralAttribute): void {
  writer.writeString(attribute.name)
  writer.writeString(attribute.value)
}
