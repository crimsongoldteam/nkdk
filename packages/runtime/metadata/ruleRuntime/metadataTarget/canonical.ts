import type { ParsedDataTableTarget } from "./types"

export function dataTableCanonical(target: ParsedDataTableTarget): string {
  return [
    target.root,
    target.objectName,
    ...(target.objectSegments ?? []).flatMap((segment) => [segment.kind, segment.objectName]),
    ...(target.tableSegments ?? []).flatMap((segment) => [segment.kind, segment.name]),
    ...(target.virtualTable === undefined ? [] : [target.virtualTable]),
  ].join(".")
}
