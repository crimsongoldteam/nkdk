import { join } from "path"
import { describe, expect, it } from "vitest"
import { parseMetadataTargetFromYAML } from "../commonObjects/metadataTargets"
import type { ParsedMetadataTarget } from "../commonObjects/metadataTargets/types"
import {
  createProjectReferenceIndex,
  createProjectReferenceSnapshot,
  projectMemberIndexKey,
  projectObjectIndexKey,
  projectValueIndexKey,
  type ProjectMemberIndexEntry,
  type ProjectObjectIndexEntry,
  type ProjectValueIndexEntry,
} from "./projectReferenceIndex"
import { createProjectValidationGraph } from "./projectValidationGraph"
import type { ComponentValidationLayer } from "./projectValidationTypes"
import {
  createSharedProjectReferenceIndex,
  createSharedProjectReferenceSnapshot,
  createSharedProjectReferenceSnapshotFromGraph,
} from "./sharedProjectReferenceIndex"

describe("SharedProjectReferenceIndex", () => {
  it("matches object, member, value and filter behavior of the regular index", () => {
    const projectDir = "/tmp/nkdk-project"
    const filePath = join(projectDir, "Справочник", "Номенклатура", "Свойства.yaml")
    const object = objectTarget("Справочник.Номенклатура")
    const member = memberTarget("Справочник.Номенклатура.Реквизит.Артикул")
    const nestedMember = memberTarget("Справочник.Номенклатура.ТабличнаяЧасть.Товары.Реквизит.Количество")
    const value = valueTarget("Перечисление.ВидыЦен.Розничная")
    const objectEntries: ProjectObjectIndexEntry[] = [
      { canonical: projectObjectIndexKey(object), target: object, result: { ok: true, filePath } },
    ]
    const memberEntries: ProjectMemberIndexEntry[] = [
      {
        canonical: projectMemberIndexKey(member),
        target: member,
        result: { ok: true, filePath, details: { kind: "attribute", typeInfo: { kinds: ["string"] } } },
      },
      {
        canonical: projectMemberIndexKey(nestedMember),
        target: nestedMember,
        result: { ok: true, filePath, details: { kind: "attribute", typeInfo: { kinds: ["decimal"] } } },
      },
    ]
    const valueEntries: ProjectValueIndexEntry[] = [
      { canonical: projectValueIndexKey(value), target: value, result: { ok: true, filePath } },
    ]
    const references = [
      reference({ filePath, canonical: projectObjectIndexKey(object), target: object, constraint: { kind: "object" } }),
      reference({
        filePath,
        canonical: projectMemberIndexKey(member),
        target: member,
        constraint: { kind: "member", owner: "explicit", filters: [{ kind: "hasType", type: "string" }] },
      }),
      reference({
        filePath,
        canonical: projectMemberIndexKey(nestedMember),
        target: nestedMember,
        constraint: { kind: "member", owner: "explicit", filters: [{ kind: "directMember" }] },
      }),
      reference({ filePath, canonical: projectValueIndexKey(value), target: value, constraint: { kind: "object" } }),
    ]
    const regular = createProjectReferenceIndex({
      projectDir,
      snapshot: createProjectReferenceSnapshot({
        objectIndexEntries: objectEntries,
        memberIndexEntries: memberEntries,
        valueIndexEntries: valueEntries,
        pendingReferences: [],
      }),
    })
    const shared = createSharedProjectReferenceIndex({
      projectDir,
      snapshot: createSharedProjectReferenceSnapshot({
        objectIndexEntries: objectEntries,
        memberIndexEntries: memberEntries,
        valueIndexEntries: valueEntries,
      }),
    })

    expect(references.map((item) => shared.resolve(item))).toEqual(references.map((item) => regular.resolve(item)))
    expect(shared.stats()).toMatchObject({ hits: 3, filterFailures: 1, misses: 0, conflicts: 0, fallbacks: 0 })
  })

  it("preserves conflicts", () => {
    const projectDir = "/tmp/nkdk-project"
    const target = memberTarget("Справочник.Номенклатура.Реквизит.Артикул")
    const filePath = join(projectDir, "Справочник", "Номенклатура", "Свойства.yaml")
    const entries: ProjectMemberIndexEntry[] = [
      { canonical: projectMemberIndexKey(target), target, result: { ok: true, filePath } },
      { canonical: projectMemberIndexKey(target), target, result: { ok: true, filePath } },
    ]
    const index = createSharedProjectReferenceIndex({
      projectDir,
      snapshot: createSharedProjectReferenceSnapshot({
        objectIndexEntries: [],
        memberIndexEntries: entries,
        valueIndexEntries: [],
      }),
    })

    expect(
      index.resolve({
        filePath,
        yamlPath: ["Поле"],
        canonical: projectMemberIndexKey(target),
        target,
        constraint: { kind: "member", owner: "explicit" },
      })
    ).toMatchObject({ ok: false, reason: "conflict" })
    expect(index.stats()).toMatchObject({ conflicts: 1 })
  })

  it("resolves references only through visible component layers", () => {
    const common = memberTarget("Справочник.Товары.Реквизит.Представление")
    const warehouseOnly = memberTarget("Справочник.Склад.Реквизит.Адрес")
    const graph = createProjectValidationGraph([
      referenceLayer("cf", [memberEntry(common, "string")]),
      referenceLayer("cfe/Продажи", [memberEntry(common, "decimal")]),
      referenceLayer("cfe/Склад", [memberEntry(common, "boolean"), memberEntry(warehouseOnly, "string")]),
    ])
    const snapshot = createSharedProjectReferenceSnapshotFromGraph(graph)
    const base = createSharedProjectReferenceIndex({
      projectDir: "/project",
      componentPath: "cf",
      snapshot,
    })
    const sales = createSharedProjectReferenceIndex({
      projectDir: "/project",
      componentPath: "cfe/Продажи",
      snapshot,
    })

    expect(base.resolve(typedReference(common, "string"))).toEqual({
      ok: true,
    })
    expect(sales.resolve(typedReference(common, "decimal"))).toEqual({
      ok: true,
    })
    expect(sales.resolve(typedReference(warehouseOnly, "string"))).toMatchObject({ ok: false, reason: "notFound" })
    expect(snapshot.stats.conflicts).toBe(0)
  })

  it("preserves conflicts within a component layer", () => {
    const target = memberTarget("Справочник.Товары.Реквизит.Представление")
    const entry = memberEntry(target, "string")
    const snapshot = createSharedProjectReferenceSnapshotFromGraph(
      createProjectValidationGraph([referenceLayer("cfe/Продажи", [entry, entry])])
    )
    const index = createSharedProjectReferenceIndex({
      projectDir: "/project",
      componentPath: "cfe/Продажи",
      snapshot,
    })

    expect(index.resolve(typedReference(target, "string"))).toMatchObject({
      ok: false,
      reason: "conflict",
    })
    expect(snapshot.stats.conflicts).toBe(1)
  })
})

function referenceLayer(
  componentPath: string,
  memberIndexEntries: ProjectMemberIndexEntry[]
): ComponentValidationLayer {
  return {
    componentPath,
    contribution: {
      objectRecords: [],
      objectIndexEntries: [],
      memberIndexEntries,
      valueIndexEntries: [],
      pendingReferences: [],
    },
  }
}

function memberEntry(
  target: Extract<ParsedMetadataTarget, { kind: "member" }>,
  type: "boolean" | "decimal" | "string"
): ProjectMemberIndexEntry {
  return {
    canonical: projectMemberIndexKey(target),
    target,
    result: {
      ok: true,
      details: {
        kind: "attribute",
        typeInfo: { kinds: [type], sourceText: type },
      },
    },
  }
}

function typedReference(
  target: Extract<ParsedMetadataTarget, { kind: "member" }>,
  type: "boolean" | "decimal" | "string"
) {
  return reference({
    filePath: "/project/Справочник/Товары/Свойства.yaml",
    canonical: projectMemberIndexKey(target),
    target,
    constraint: {
      kind: "member",
      owner: "explicit",
      filters: [{ kind: "hasType", type }],
    },
  })
}

function reference(params: {
  filePath: string
  canonical: string
  target: ParsedMetadataTarget
  constraint: Parameters<ReturnType<typeof createProjectReferenceIndex>["resolve"]>[0]["constraint"]
}) {
  return {
    filePath: params.filePath,
    yamlPath: ["Поле"],
    canonical: params.canonical,
    target: params.target,
    constraint: params.constraint,
  }
}

function objectTarget(value: string): Extract<ParsedMetadataTarget, { kind: "object" }> {
  const parsed = parseMetadataTargetFromYAML({ value, constraint: { kind: "object" } })
  if (!parsed.ok || parsed.target.kind !== "object") throw new Error(value)
  return parsed.target
}

function memberTarget(value: string): Extract<ParsedMetadataTarget, { kind: "member" }> {
  const parsed = parseMetadataTargetFromYAML({ value, constraint: { kind: "member", owner: "explicit" } })
  if (!parsed.ok || parsed.target.kind !== "member") throw new Error(value)
  return parsed.target
}

function valueTarget(value: string): Extract<ParsedMetadataTarget, { kind: "value" }> {
  const parsed = parseMetadataTargetFromYAML({
    value,
    constraint: { kind: "value", roots: ["Enum"], valueKinds: ["enumValue"] },
  })
  if (!parsed.ok || parsed.target.kind !== "value") throw new Error(value)
  return parsed.target
}
