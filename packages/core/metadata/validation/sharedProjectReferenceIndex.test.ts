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
import { createSharedProjectReferenceIndex, createSharedProjectReferenceSnapshot } from "./sharedProjectReferenceIndex"

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
      mode: "full",
      snapshot: createProjectReferenceSnapshot({ objectIndexEntries: objectEntries, memberIndexEntries: memberEntries, valueIndexEntries: valueEntries, pendingReferences: [] }),
    })
    const shared = createSharedProjectReferenceIndex({
      projectDir,
      mode: "full",
      snapshot: createSharedProjectReferenceSnapshot({ objectIndexEntries: objectEntries, memberIndexEntries: memberEntries, valueIndexEntries: valueEntries }),
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
      mode: "full",
      snapshot: createSharedProjectReferenceSnapshot({ objectIndexEntries: [], memberIndexEntries: entries, valueIndexEntries: [] }),
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
})

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
  const parsed = parseMetadataTargetFromYAML({ value, constraint: { kind: "value", roots: ["Enum"], valueKinds: ["enumValue"] } })
  if (!parsed.ok || parsed.target.kind !== "value") throw new Error(value)
  return parsed.target
}
