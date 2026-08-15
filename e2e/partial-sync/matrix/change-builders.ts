import type { ScenarioFileChange, ScenarioFileContents } from "./types"

type ReplaceYamlLineParams = {
  readonly path: string
  readonly contents: string
  readonly key: string
  readonly value: string
}

type AppendYamlSectionParams = {
  readonly path: string
  readonly contents: string
  readonly section: string
}

type ReplaceTextParams = {
  readonly path: string
  readonly contents: string
  readonly before: string
  readonly after: string
}

type ReplaceBinaryParams = {
  readonly path: string
  readonly before: Uint8Array
  readonly after: Uint8Array
}

export function replaceYamlLine(params: ReplaceYamlLineParams): ScenarioFileChange {
  const pattern = new RegExp(
    `^([ \\t]*)${escapeRegExp(params.key)}:[^\\r\\n]*(\\r?\\n|$)`,
    "gmu",
  )
  const matches = [...params.contents.matchAll(pattern)]
  if (matches.length !== 1) {
    throw new Error(`Не найдена единственная YAML-строка ${params.key}: ${params.path}`)
  }
  const match = matches[0]
  const indentation = match[1] ?? ""
  const lineEnding = match[2] ?? ""
  const start = match.index
  const replacement = `${indentation}${params.key}: ${params.value}${lineEnding}`
  return {
    path: params.path,
    before: params.contents,
    after: replaceRange(params.contents, start, match[0].length, replacement),
  }
}

export function appendYamlSection(params: AppendYamlSectionParams): ScenarioFileChange {
  if (!params.contents.endsWith("\n") || params.section.length === 0 || !params.section.endsWith("\n")) {
    throw new Error(`YAML-раздел должен быть непустым и завершаться переводом строки: ${params.path}`)
  }
  return {
    path: params.path,
    before: params.contents,
    after: `${params.contents}${params.section}`,
  }
}

export function replaceText(params: ReplaceTextParams): ScenarioFileChange {
  if (params.before.length === 0) {
    throw new Error(`Не найден единственный текстовый фрагмент: ${params.path}`)
  }
  const start = params.contents.indexOf(params.before)
  if (start < 0 || params.contents.indexOf(params.before, start + params.before.length) >= 0) {
    throw new Error(`Не найден единственный текстовый фрагмент: ${params.path}`)
  }
  return {
    path: params.path,
    before: params.contents,
    after: replaceRange(params.contents, start, params.before.length, params.after),
  }
}

export function replaceBinary(params: ReplaceBinaryParams): ScenarioFileChange {
  return {
    path: params.path,
    before: new Uint8Array(params.before),
    after: new Uint8Array(params.after),
  }
}

export function chainChanges(
  ...changes: readonly ScenarioFileChange[]
): readonly ScenarioFileChange[] {
  const previousByPath = new Map<string, ScenarioFileChange>()
  for (const change of changes) {
    const previous = previousByPath.get(change.path)
    if (previous !== undefined && !contentsEqual(previous.after, change.before)) {
      throw new Error(`Разрыв цепочки изменений: ${change.path}`)
    }
    previousByPath.set(change.path, change)
  }
  return changes
}

function replaceRange(contents: string, start: number, length: number, replacement: string): string {
  return `${contents.slice(0, start)}${replacement}${contents.slice(start + length)}`
}

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/gu, "\\$&")
}

function contentsEqual(
  left: ScenarioFileContents | null,
  right: ScenarioFileContents | null,
): boolean {
  if (left === null || right === null) return left === right
  if (typeof left === "string" || typeof right === "string") return left === right
  return left.length === right.length && left.every((value, index) => value === right[index])
}
