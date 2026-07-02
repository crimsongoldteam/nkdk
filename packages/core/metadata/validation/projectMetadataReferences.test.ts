import { describe, expect, it } from "vitest"
import type { ParsedMetadataTarget } from "../commonObjects/metadataTargets"
import {
  createProjectReferenceSnapshot,
  estimateProjectReferenceSnapshotBytes,
  projectMemberIndexKey,
  resolvePendingReference,
  validatePendingReferences,
  type PendingMetadataTargetReference,
  type ProjectMemberIndexEntry,
} from "./projectMetadataReferences"

describe("project metadata references", () => {
  it("resolves indexed member references by canonical target", () => {
    const target = memberTarget("Catalog.Номенклатура.Attribute.Артикул")
    const entries: ProjectMemberIndexEntry[] = [
      {
        canonical: "Catalog.Номенклатура.Attribute.Артикул",
        target,
        result: { ok: true, filePath: "/tmp/Справочник/Номенклатура/Свойства.yaml", details: { kind: "attribute" } },
      },
    ]
    const snapshot = createProjectReferenceSnapshot({ memberIndexEntries: entries, pendingReferences: [] })

    expect(resolvePendingReference({ snapshot, reference: pending(target) })).toEqual({ ok: true })
  })

  it("falls back when member reference is not indexed", () => {
    const target = memberTarget("Catalog.Номенклатура.Attribute.НетТакого")
    const snapshot = createProjectReferenceSnapshot({ memberIndexEntries: [], pendingReferences: [] })

    expect(resolvePendingReference({ snapshot, reference: pending(target) })).toEqual({ ok: false, reason: "miss" })
  })

  it("keeps conflicting entries out of the fast path", () => {
    const target = memberTarget("Catalog.Номенклатура.Attribute.Артикул")
    const entries: ProjectMemberIndexEntry[] = [
      { canonical: "Catalog.Номенклатура.Attribute.Артикул", target, result: { ok: true, filePath: "/tmp/1.yaml" } },
      { canonical: "Catalog.Номенклатура.Attribute.Артикул", target, result: { ok: true, filePath: "/tmp/2.yaml" } },
    ]
    const snapshot = createProjectReferenceSnapshot({ memberIndexEntries: entries, pendingReferences: [] })

    expect(resolvePendingReference({ snapshot, reference: pending(target) })).toEqual({
      ok: false,
      reason: "conflict",
    })
  })

  it("estimates cloneable snapshot bytes", () => {
    const target = memberTarget("Catalog.Номенклатура.Attribute.Артикул")
    const snapshot = createProjectReferenceSnapshot({
      memberIndexEntries: [{ canonical: "Catalog.Номенклатура.Attribute.Артикул", target, result: { ok: true } }],
      pendingReferences: [pending(target)],
    })

    expect(estimateProjectReferenceSnapshotBytes(snapshot)).toBeGreaterThan(100)
  })

  it("validates pending references through the fast path", () => {
    const target = memberTarget("Catalog.Номенклатура.Attribute.Артикул")
    const snapshot = createProjectReferenceSnapshot({
      memberIndexEntries: [
        {
          canonical: "Catalog.Номенклатура.Attribute.Артикул",
          target,
          result: { ok: true, filePath: "/tmp/Справочник/Номенклатура/Свойства.yaml" },
        },
      ],
      pendingReferences: [pending(target)],
    })

    expect(
      validatePendingReferences({
        snapshot,
        references: snapshot.pendingReferences,
        resolver: {} as never,
      })
    ).toEqual({ diagnostics: [], hits: 1, misses: 0, fallbacks: 0 })
  })
})

function pending(target: Extract<ParsedMetadataTarget, { kind: "member" }>): PendingMetadataTargetReference {
  return {
    filePath: "/tmp/ФункциональнаяОпция/Опция/Свойства.yaml",
    yamlPath: ["Состав", 0],
    canonical: projectMemberIndexKey(target),
    target,
    constraint: { kind: "member", owner: "explicit" },
  }
}

function memberTarget(canonical: string): Extract<ParsedMetadataTarget, { kind: "member" }> {
  const [root, objectName, memberKind, name] = canonical.split(".")
  return {
    kind: "member",
    root: root as never,
    objectName: objectName ?? "",
    segments: [{ kind: memberKind as never, name: name ?? "" }],
  }
}
