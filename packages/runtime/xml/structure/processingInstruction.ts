import type { XmlProcessingInstructionNode } from "../import/document"

export interface ParsedXmlProcessingInstructionAttribute {
  readonly name: string
  readonly value: string
  readonly occurrence: number
  readonly start: number
  readonly end: number
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

const XML_NAME_PATTERN = String.raw`[:_\p{L}][:_\-.0-9\p{L}\p{M}\p{N}\u00B7]*`
const XML_NAME = new RegExp(`^${XML_NAME_PATTERN}$`, "u")
const PI_ATTRIBUTE = new RegExp(
  `(^|\\s+)(${XML_NAME_PATTERN})\\s*=\\s*(["'])([\\s\\S]*?)\\3`,
  "gu"
)

export function parseXmlProcessingInstructionAttributes(
  body: string
): readonly ParsedXmlProcessingInstructionAttribute[] {
  const occurrences = new Map<string, number>()
  return [...body.matchAll(PI_ATTRIBUTE)].map((match) => {
    const boundary = match[1] ?? ""
    const name = match[2] ?? ""
    const occurrence = (occurrences.get(name) ?? 0) + 1
    occurrences.set(name, occurrence)
    const source = match[0]
    const matchStart = match.index ?? 0
    const start = matchStart + boundary.length
    return {
      name,
      value: normalizeXmlLineEndings(match[4] ?? ""),
      occurrence,
      start,
      end: matchStart + source.length,
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

function normalizeXmlLineEndings(value: string): string {
  return value.replaceAll("\r\n", "\n").replaceAll("\r", "\n")
}
