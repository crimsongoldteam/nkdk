import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { MetadataItemRule } from "../../orchestration/property/types"
import {
  clearDataPathResolverRegistryForTests,
  getDataPathOwnerKind,
  getOwnerKindByMetadataLinkPrefix,
  getOwnerKindByTypeDescriptionBase,
  registerDataPathOwnerKind,
  restoreDataPathResolverRegistryForTests,
  snapshotDataPathResolverRegistryForTests,
  type DataPathResolverRegistrySnapshot,
} from "./registry"

const SampleRule = {
  itemType: "MetadataCatalog",
  itemTypePrefix: "Справочник",
  properties: {},
} as const satisfies MetadataItemRule

describe("DataPathResolverRegistry", () => {
  let snapshot: DataPathResolverRegistrySnapshot

  beforeEach(() => {
    snapshot = snapshotDataPathResolverRegistryForTests()
    clearDataPathResolverRegistryForTests()
  })

  afterEach(() => restoreDataPathResolverRegistryForTests(snapshot))

  it("registers owner kind by visible kind, TypeDescription base and metadata link prefix", () => {
    registerDataPathOwnerKind({
      kind: "Справочник",
      projectDir: "Справочник",
      rule: SampleRule,
      typeDescriptionBases: ["CatalogRef", "CatalogObject"],
      metadataLinkPrefixes: ["Catalog"],
    })

    expect(getDataPathOwnerKind("Справочник")).toMatchObject({ projectDir: "Справочник", rule: SampleRule })
    expect(getOwnerKindByTypeDescriptionBase("CatalogRef")).toBe("Справочник")
    expect(getOwnerKindByTypeDescriptionBase("CatalogObject")).toBe("Справочник")
    expect(getOwnerKindByMetadataLinkPrefix("Catalog")).toBe("Справочник")
  })
})
