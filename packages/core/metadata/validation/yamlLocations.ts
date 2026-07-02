import { isMap, isPair, isScalar, isSeq } from "yaml"
import type { Pair, Scalar, YAMLMap } from "yaml"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import type { Diagnostic, DiagnosticSeverity, DiagnosticSource } from "./types"

export type YamlPath = readonly (string | number)[]

export interface DiagnosticAtYamlPathParams {
  filePath: string
  parsed: ParsedYaml
  path: YamlPath
  severity: DiagnosticSeverity
  source: DiagnosticSource
  message: string
}

export function diagnosticAtYamlPath({
  filePath,
  parsed,
  path,
  severity,
  source,
  message,
}: DiagnosticAtYamlPathParams): Diagnostic {
  const indexPosition = parsed.locations?.keyPosition(path)
  const offset = indexPosition === undefined ? findYamlPathOffset(parsed.doc.contents, path) : undefined
  const position = indexPosition ?? (offset === undefined ? { line: 1, col: 1 } : parsed.lineCounter.linePos(offset))

  return {
    filePath,
    line: position.line,
    col: position.col,
    message,
    severity,
    source,
    path: yamlPathToPointer(path),
  }
}

function findYamlPathOffset(root: unknown, path: YamlPath): number | undefined {
  if (path.length === 0) return nodeOffset(root)

  let node = root
  for (let index = 0; index < path.length; index += 1) {
    const segment = path[index]
    const isLast = index === path.length - 1

    if (typeof segment === "string") {
      if (!isMap(node)) return undefined

      const pair = findMapPair(node, segment)
      if (pair === undefined) return undefined
      if (isLast) return keyOffset(pair)

      node = pair.value
      continue
    }

    if (!isSeq(node)) return undefined

    const item = node.items[segment]
    if (item === undefined || item === null) return undefined
    if (isLast) return nodeOffset(item)

    node = item
  }

  return nodeOffset(node)
}

function findMapPair(map: YAMLMap, key: string): Pair<Scalar, unknown> | undefined {
  const pair = map.items.find((item) => isPair(item) && isScalar(item.key) && item.key.value === key)
  if (!pair || !isPair(pair) || !isScalar(pair.key)) return undefined
  return pair as Pair<Scalar, unknown>
}

function keyOffset(pair: Pair<Scalar, unknown>): number | undefined {
  return pair.key?.range?.[0]
}

function nodeOffset(node: unknown): number | undefined {
  if (node === undefined || node === null || typeof node !== "object") return undefined
  const range = (node as { range?: readonly number[] }).range
  return Array.isArray(range) ? range[0] : undefined
}

function yamlPathToPointer(path: YamlPath): string | undefined {
  if (path.length === 0) return undefined
  return `/${path.map((segment) => String(segment).replace(/~/g, "~0").replace(/\//g, "~1")).join("/")}`
}
