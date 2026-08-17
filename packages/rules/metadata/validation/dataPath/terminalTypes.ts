import type { DataPathAllowedKind, NormalizedDataPathTerminalType } from "@nkdk/runtime/rule-kit"

export * from "@nkdk/runtime/rule-kit"

export function dataPathTerminalGroupsIntersect(
  left: NormalizedDataPathTerminalType,
  right: NormalizedDataPathTerminalType,
): boolean | undefined {
  if (left.status === "notResolved" || right.status === "notResolved") return undefined
  if (left.groups.includes("<any>") || right.groups.includes("<any>")) return undefined

  return left.groups.some((leftGroup) =>
    right.groups.some((rightGroup) => terminalGroupsIntersect(leftGroup, rightGroup)))
}

function terminalGroupsIntersect(left: DataPathAllowedKind, right: DataPathAllowedKind): boolean {
  if (left === right) return true
  if (left === "AnyIBRef" && isReferenceGroup(right)) return true
  if (right === "AnyIBRef" && isReferenceGroup(left)) return true
  return false
}

function isReferenceGroup(group: DataPathAllowedKind): boolean {
  return group === "AnyIBRef" || group.endsWith("Ref.*")
}
