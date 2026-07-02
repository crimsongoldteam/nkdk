import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { ParsedMetadataTarget } from "../commonObjects/metadataTargets"
import {
  clearProjectMetadataResolverRegistryForTests,
  getProjectReferenceMemberContributors,
  getProjectReferenceObjectPathContributor,
  registerProjectReferenceMemberContributor,
  registerProjectReferenceObjectPathContributor,
  restoreProjectMetadataResolverRegistryForTests,
  snapshotProjectMetadataResolverRegistryForTests,
  type ProjectMetadataResolverRegistrySnapshot,
} from "./projectMetadataResolverRegistry"

describe("project reference index registry", () => {
  let snapshot: ProjectMetadataResolverRegistrySnapshot

  beforeEach(() => {
    snapshot = snapshotProjectMetadataResolverRegistryForTests()
    clearProjectMetadataResolverRegistryForTests()
  })

  afterEach(() => restoreProjectMetadataResolverRegistryForTests(snapshot))

  it("registers object path and member resolvers by root/kind", () => {
    registerProjectReferenceObjectPathContributor("Document", ({ projectDir, target }) => ({
      filePath: `${projectDir}/Документ/${target.objectName}/Свойства.yaml`,
    }))
    registerProjectReferenceMemberContributor("Form", ({ ownerFilePath, segment }) => ({
      ok: true,
      filePath: `${ownerFilePath}/../Формы/${segment.name}/Форма.yaml`,
      details: { kind: "Form", name: segment.name, item: segment.name },
    }))

    const target = {
      kind: "object",
      root: "Document",
      objectName: "Заказ",
    } as Extract<ParsedMetadataTarget, { kind: "object" }>
    expect(getProjectReferenceObjectPathContributor("Document")?.({ projectDir: "/p", target })).toEqual({
      filePath: "/p/Документ/Заказ/Свойства.yaml",
    })
    expect(getProjectReferenceMemberContributors("Form")[0]).toBeTypeOf("function")
  })
})
