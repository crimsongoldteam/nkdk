import { validateMetadataLocalName } from "./nameRules"

export interface ParsedMetadataOperationPath {
  ok: true
  path: string
  owner: { itemTypePrefix: string; name: string }
  chain: ParsedMetadataOperationPathSegment[]
  localName: string
}

export interface ParsedMetadataOperationPathSegment {
  collectionSegment: string
  name: string
}

export interface MetadataOperationPathFailure {
  ok: false
  code: "invalid_path"
  message: string
}

export type MetadataOperationPathParseResult = ParsedMetadataOperationPath | MetadataOperationPathFailure

export function parseMetadataOperationPath(path: string): MetadataOperationPathParseResult {
  if (path.length === 0) return invalidPath("Путь metadata-операции пуст")

  const parts = path.split(".")
  if (parts.some((part) => part.length === 0)) return invalidPath(`Некорректный путь metadata-операции: ${path}`)
  if (parts.length < 2) return invalidPath(`Путь metadata-операции должен начинаться с вида и имени объекта: ${path}`)
  if ((parts.length - 2) % 2 !== 0) return invalidPath(`Незавершенный путь metadata-операции: ${path}`)

  for (const part of parts) {
    const name = validateMetadataLocalName(part)
    if (!name.ok) return invalidPath(`Некорректный сегмент "${part}" в пути metadata-операции`)
  }

  const chain: ParsedMetadataOperationPathSegment[] = []
  for (let index = 2; index < parts.length; index += 2) {
    chain.push({ collectionSegment: parts[index]!, name: parts[index + 1]! })
  }

  return {
    ok: true,
    path,
    owner: { itemTypePrefix: parts[0]!, name: parts[1]! },
    chain,
    localName: chain.at(-1)?.name ?? parts[1]!,
  }
}

export function buildRenameTargetPathFromOperationPath(path: string, newName: string): string {
  const parsed = parseMetadataOperationPath(path)
  if (!parsed.ok) throw new Error(parsed.message)
  const dot = path.lastIndexOf(".")
  return dot < 0 ? newName : `${path.slice(0, dot + 1)}${newName}`
}

function invalidPath(message: string): MetadataOperationPathFailure {
  return { ok: false, code: "invalid_path", message }
}
