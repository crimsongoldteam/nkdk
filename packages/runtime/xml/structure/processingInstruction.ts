import type { XmlProcessingInstructionNode } from "../import/document"

export interface ParsedXmlProcessingInstructionAttribute {
  readonly name: string
  readonly value: string
  readonly occurrence: number
  readonly start: number
  readonly end: number
  readonly quoteStart: number
  readonly quoteEnd: number
}

type XmlProcessingInstructionAttributeValue = {
  readonly name: string
  readonly value: string
  readonly occurrence?: number
}

type XmlProcessingInstructionValue = Pick<
  XmlProcessingInstructionNode,
  "target" | "body"
> & {
  readonly attributes: readonly XmlProcessingInstructionAttributeValue[]
}

const XML_NAME = /^[:_\p{L}][:_\-.0-9\p{L}\p{M}\p{N}\u00B7]*$/u
const PI_ATTRIBUTE = /([^\s=]+)\s*=\s*(["'])([\s\S]*?)\2/gu

export function parseXmlProcessingInstructionAttributes(
  body: string
): readonly ParsedXmlProcessingInstructionAttribute[] {
  const occurrences = new Map<string, number>()
  return [...body.matchAll(PI_ATTRIBUTE)].map((match) => {
    const name = match[1] ?? ""
    const occurrence = (occurrences.get(name) ?? 0) + 1
    occurrences.set(name, occurrence)
    const source = match[0]
    const quote = match[2] ?? '"'
    const start = match.index ?? 0
    const relativeQuoteStart = source.indexOf(quote)
    const relativeQuoteEnd = source.lastIndexOf(quote)
    return {
      name,
      value: normalizeXmlLineEndings(match[3] ?? ""),
      occurrence,
      start,
      end: start + source.length,
      quoteStart: start + relativeQuoteStart,
      quoteEnd: start + relativeQuoteEnd,
    }
  })
}

export function validateXmlProcessingInstruction(
  instruction: XmlProcessingInstructionValue
): void {
  if (!XML_NAME.test(instruction.target) || instruction.target.toLowerCase() === "xml") {
    throw new Error(`Недопустимое имя processing instruction: ${instruction.target}`)
  }
  if (instruction.body.includes("?>")) {
    throw new Error("Processing instruction body не может содержать ?>")
  }
  if (/^\s/u.test(instruction.body) || instruction.body.includes("\r")) {
    throw new Error("Processing instruction body не соответствует нормализованной SAX-форме")
  }
  assertValidXmlCharacters(instruction.body)

  const parsedAttributes = parseXmlProcessingInstructionAttributes(instruction.body)
  assertQuotesBelongToAttributes(instruction.body, parsedAttributes)
  if (
    parsedAttributes.length !== instruction.attributes.length ||
    parsedAttributes.some((parsed, index) => {
      const expected = instruction.attributes[index]
      return (
        expected === undefined ||
        parsed.name !== expected.name ||
        parsed.value !== expected.value ||
        (expected.occurrence !== undefined && parsed.occurrence !== expected.occurrence)
      )
    })
  ) {
    throw new Error("PI body и адресованные псевдоатрибуты не совпадают")
  }
}

function assertValidXmlCharacters(value: string): void {
  for (const character of value) {
    const codePoint = character.codePointAt(0)!
    if (
      codePoint !== 0x9 &&
      codePoint !== 0xa &&
      !(codePoint >= 0x20 && codePoint <= 0xd7ff) &&
      !(codePoint >= 0xe000 && codePoint <= 0xfffd) &&
      !(codePoint >= 0x10000 && codePoint <= 0x10ffff)
    ) {
      throw new Error("Processing instruction body содержит недопустимый XML-символ")
    }
  }
}

function assertQuotesBelongToAttributes(
  body: string,
  attributes: readonly ParsedXmlProcessingInstructionAttribute[]
): void {
  const quotedRanges = attributes.map(({ name, quoteStart, quoteEnd }) => {
    if (!XML_NAME.test(name)) {
      throw new Error(`Недопустимое имя псевдоатрибута processing instruction: ${name}`)
    }
    return { start: quoteStart, end: quoteEnd }
  })
  for (let index = 0; index < body.length; index += 1) {
    const character = body[index]
    if (
      (character === '"' || character === "'") &&
      !quotedRanges.some(({ start, end }) => index >= start && index <= end)
    ) {
      throw new Error("Processing instruction body содержит несбалансированную кавычку")
    }
  }
}

function normalizeXmlLineEndings(value: string): string {
  return value.replaceAll("\r\n", "\n").replaceAll("\r", "\n")
}
