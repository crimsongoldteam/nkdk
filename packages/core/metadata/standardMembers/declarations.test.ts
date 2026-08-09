import { afterEach, describe, expect, it } from "vitest"
import {
  clearStandardMembersForTests,
  getStandardMembers,
  registerStandardMembers,
  restoreStandardMembersForTests,
  snapshotStandardMembersForTests,
  type StandardMemberDeclaration,
} from "./declarations"

describe("standard member declarations", () => {
  const initial = snapshotStandardMembersForTests()

  afterEach(() => restoreStandardMembersForTests(initial))

  it("stores declarations independently from DataPath", () => {
    clearStandardMembersForTests()
    const declaration = {
      memberKind: "standardAttribute",
      family: "primitive",
      kind: "string",
      names: { internal: "Code", yaml: "Код" },
      phase: "index-time",
      sourceScope: "ownerModel",
      fillValue: { policy: "byEffectiveType" },
    } as const satisfies StandardMemberDeclaration

    registerStandardMembers("Catalog", [declaration])

    expect(getStandardMembers("Catalog")).toEqual([declaration])
  })
})
