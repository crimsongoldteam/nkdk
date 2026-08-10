import { expect, it } from "vitest"

import type { ParsedMetadataTarget } from "../ruleRuntime/metadataTarget"
import {
  applyLegacyProjectReferenceContributions,
  createProjectReferenceRegistrySet,
  getProjectReferenceObjectPathContributor,
  restoreProjectReferenceIndexRegistryForTests,
  snapshotProjectReferenceIndexRegistryForTests,
  type ProjectReferenceContribution,
} from "./projectReferenceIndexRegistry"

it("isolates project reference contributions between rule sets", () => {
  const createContributions = (filePath: string): readonly ProjectReferenceContribution[] => [
    {
      kind: "objectPath",
      root: "Document",
      contributor: () => ({ filePath }),
    },
    {
      kind: "member",
      memberKind: "Field",
      contributor: () => ({ ok: true, filePath }),
    },
    {
      kind: "value",
      root: "Enum",
      contributor: () => ({ ok: true, filePath }),
    },
    {
      kind: "fileValidator",
      role: "configuration",
      validator: () => [],
    },
    {
      kind: "memberIndex",
      contributor: () => [],
    },
  ]

  const first = createProjectReferenceRegistrySet(createContributions("first.yaml"))
  const second = createProjectReferenceRegistrySet(createContributions("second.yaml"))
  const target = {
    kind: "object",
    root: "Document",
    objectName: "Sample",
  } as Extract<ParsedMetadataTarget, { kind: "object" }>

  expect(first.getObjectPathContributor("Document")?.({ projectDir: "/p", target })).toEqual({
    filePath: "first.yaml",
  })
  expect(second.getObjectPathContributor("Document")?.({ projectDir: "/p", target })).toEqual({
    filePath: "second.yaml",
  })
  expect(first.getMemberContributors("Field")).toHaveLength(1)
  expect(first.getValueContributor("Enum")).toBeTypeOf("function")
  expect(first.getFileValidators("configuration")).toHaveLength(1)
  expect(first.getMemberIndexContributors()).toHaveLength(1)
})

it("adapts pure contributions to the legacy global registry during migration", () => {
  const snapshot = snapshotProjectReferenceIndexRegistryForTests()
  try {
    applyLegacyProjectReferenceContributions([{
      kind: "objectPath",
      root: "Document",
      contributor: () => ({ filePath: "legacy.yaml" }),
    }])

    expect(getProjectReferenceObjectPathContributor("Document")).toBeTypeOf("function")
  } finally {
    restoreProjectReferenceIndexRegistryForTests(snapshot)
  }
})
