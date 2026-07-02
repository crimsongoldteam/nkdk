import { JSON_SCHEMA, NOT_RESOLVED, defineScalarTag, dump, type Document, type Node } from "js-yaml"
import { isExplicitYAMLString, unwrapExplicitYAMLString } from "./explicitString"

const explicitStringTagName = "tag:nakidka.dev,2026:explicit-string"

const explicitStringType = defineScalarTag(explicitStringTagName, {
  resolve: () => NOT_RESOLVED,
  identify: isExplicitYAMLString,
  represent: (value: unknown) => String(unwrapExplicitYAMLString(value)),
})

const NKDK_DUMP_SCHEMA = JSON_SCHEMA.withTags(explicitStringType)

const leadingSpaceCount = (line: string): number => line.length - line.trimStart().length

const isKeepChompingBlockScalarHeader = (line: string): boolean => {
  return /^\s*(?:(?:[^#\n]*?:|-)\s*)?[|>](?:\+(?:[1-9])?|[1-9]\+)\s*(?:#.*)?$/.test(line)
}

const endsInsideBlockScalar = (yaml: string): boolean => {
  const lines = yaml.split("\n")
  let finalContentIndent = Infinity

  for (let index = lines.length - 2; index >= 0; index -= 1) {
    const line = lines[index]
    if (line.trim() === "") continue

    const indent = leadingSpaceCount(line)
    if (isKeepChompingBlockScalarHeader(line)) return indent < finalContentIndent

    finalContentIndent = Math.min(finalContentIndent, indent)
  }

  return false
}

const removeDocumentFinalLineEnding = (yaml: string): string => {
  if (!yaml.endsWith("\n")) return yaml
  if (endsInsideBlockScalar(yaml)) return yaml
  return yaml.slice(0, -1)
}

function prepareForDump(value: unknown): unknown {
  if (isExplicitYAMLString(value)) return value
  if (Array.isArray(value)) return value.map(prepareForDump)
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, item === undefined ? null : prepareForDump(item)]),
    )
  }
  return value
}

function normalizeEmptyNullValues(yaml: string): string {
  return yaml.replace(/: null$/gm, ":")
}

export const exportToYAML = <T>(data: T): string => {
  const yaml = dump(prepareForDump(data), {
    schema: NKDK_DUMP_SCHEMA,
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    skipInvalid: false,
    sortKeys: false,
    quoteStyle: "double",
    forceQuotes: false,
    transform: quoteExplicitStringNodes,
  })
  return removeDocumentFinalLineEnding(normalizeEmptyNullValues(yaml))
}

function quoteExplicitStringNodes(documents: Document[]): void {
  documents.forEach((document) => {
    quoteExplicitStringNode(document.contents)
  })
}

function quoteExplicitStringNode(node: Node | null): void {
  if (node === null) return
  if (node.kind === "scalar") {
    if (node.tag.includes(explicitStringTagName) || (node.tag === "tag:yaml.org,2002:str" && node.value === "")) {
      node.tag = "tag:yaml.org,2002:str"
      node.style.tagged = false
      node.style.doubleQuoted = true
    }
    return
  }
  if (node.kind === "sequence") {
    node.items.forEach(quoteExplicitStringNode)
    return
  }
  if (node.kind === "mapping") {
    node.items.forEach((item) => {
      quoteExplicitStringNode(item.key)
      quoteExplicitStringNode(item.value)
    })
  }
}
