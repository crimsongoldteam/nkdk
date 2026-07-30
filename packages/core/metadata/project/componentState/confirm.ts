import { createConfigurationIndexReader } from "../../configurationIndex"
import type { ComponentHashState, ComponentIndexes, ComponentProjectStructure, ConfirmedComponentState } from "./types"
import type { SharedConfigurationIndexSnapshot } from "../../configurationIndex"

export function confirmComponentState(params: {
  readonly structure: ComponentProjectStructure
  readonly hashes: ComponentHashState
  readonly indexes: ComponentIndexes
  readonly snapshot: SharedConfigurationIndexSnapshot
}): ConfirmedComponentState {
  if (
    params.structure.componentPath !== params.hashes.componentPath ||
    !equalPaths(
      params.structure.projectPaths,
      params.hashes.projectFiles.map(({ projectPath }) => projectPath)
    )
  ) {
    throw new Error("структура и хэши относятся к разному составу файлов")
  }
  if (
    params.indexes.componentPath !== params.structure.componentPath ||
    !equalProjectFiles(params.hashes.projectFiles, params.indexes.sourceProjectFiles)
  ) {
    throw new Error("индексы относятся к другому состоянию файлов")
  }
  if (createConfigurationIndexReader(params.snapshot).header().componentPath !== params.structure.componentPath) {
    throw new Error("снимок относится к другому компоненту")
  }
  return Object.freeze({ ...params })
}

function equalPaths(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function equalProjectFiles(
  left: readonly { projectPath: string; contentHash: bigint }[],
  right: readonly { projectPath: string; contentHash: bigint }[]
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (value, index) =>
        value.projectPath === right[index]?.projectPath && value.contentHash === right[index]?.contentHash
    )
  )
}
