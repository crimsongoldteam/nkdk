import { join } from "path"
import { describe, expect, it } from "vitest"
import { parseMetadataTargetFromYAML } from "../ruleRuntime/metadataTarget"
import type { ParsedMetadataTarget } from "@nkdk/runtime/rule-kit"
import {
  createProjectReferenceIndex,
  createProjectReferenceSnapshot,
  projectMemberIndexKey,
  projectObjectIndexKey,
  projectValueIndexKey,
  referenceNotIncludedInExtensionResult,
  validatePendingReferencesWithIndex,
  type ProjectMemberIndexEntry,
  type ProjectObjectIndexEntry,
  type ProjectValueIndexEntry,
} from "./projectReferenceIndex"

describe("ProjectReferenceIndex", () => {
  it.each([
    ["object", objectTarget("Справочник.Номенклатура")],
    ["member", memberTarget("Справочник.Номенклатура.Реквизит.Артикул")],
  ] as const)("reports a %s reference that is not included in the extension", (_kind, target) => {
    const reference = {
      filePath: "cfe/Цены/Источник.yaml",
      yamlPath: ["Реквизиты", "Тип"] as const,
      canonical: target.kind === "object" ? projectObjectIndexKey(target) : projectMemberIndexKey(target),
      target,
      constraint: target.kind === "object"
        ? { kind: "object" as const }
        : { kind: "member" as const, owner: "explicit" as const },
    }

    expect(referenceNotIncludedInExtensionResult(reference)).toEqual({
      ok: false,
      reason: "notFound",
      diagnostics: [{
        filePath: reference.filePath,
        line: 1,
        col: 1,
        severity: "error",
        source: "reference",
        message: `Ссылка "${reference.canonical}" не включена в расширение`,
      }],
    })
    expect(reference.yamlPath).toEqual(["Реквизиты", "Тип"])
  })

  it("resolves object entries without resolver fallback", () => {
    const projectDir = "/tmp/nkdk-project"
    const target = objectTarget("Справочник.Номенклатура")
    const filePath = join(projectDir, "Справочник", "Номенклатура", "Свойства.yaml")
    const objectEntries: ProjectObjectIndexEntry[] = [
      { canonical: projectObjectIndexKey(target), target, result: { ok: true, filePath } },
    ]
    const index = createProjectReferenceIndex({
      projectDir,
      snapshot: createProjectReferenceSnapshot({
        objectIndexEntries: objectEntries,
        memberIndexEntries: [],
        valueIndexEntries: [],
        pendingReferences: [],
      }),
    })

    expect(
      index.resolve({
        filePath,
        yamlPath: ["Поле"],
        canonical: "Справочник.Номенклатура",
        target,
        constraint: { kind: "object" },
      }),
    ).toEqual({ ok: true })
    expect(index.stats()).toMatchObject({ hits: 1, misses: 0, unsupported: 0, fallbacks: 0 })
  })

  it("resolves member entries and exposes field details for filters", () => {
    const projectDir = "/tmp/nkdk-project"
    const target = memberTarget("Справочник.Номенклатура.Реквизит.Артикул")
    const filePath = join(projectDir, "Справочник", "Номенклатура", "Свойства.yaml")
    const details = { kind: "attribute", name: "Артикул", typeInfo: { kinds: ["string"] } }
    const memberEntries: ProjectMemberIndexEntry[] = [
      { canonical: projectMemberIndexKey(target), target, result: { ok: true, filePath, details } },
    ]
    const index = createProjectReferenceIndex({
      projectDir,
      snapshot: createProjectReferenceSnapshot({
        objectIndexEntries: [],
        memberIndexEntries: memberEntries,
        valueIndexEntries: [],
        pendingReferences: [],
      }),
    })

    expect(
      index.resolve({
        filePath,
        yamlPath: ["Поле"],
        canonical: "Справочник.Номенклатура.Реквизит.Артикул",
        target,
        constraint: { kind: "member", owner: "explicit", filters: [{ kind: "hasType", type: "string" }] },
      }),
    ).toEqual({ ok: true })
    expect(index.stats()).toMatchObject({ hits: 1, misses: 0, unsupported: 0, fallbacks: 0 })
  })

  it("resolves value entries", () => {
    const projectDir = "/tmp/nkdk-project"
    const target = valueTarget("Перечисление.ВидыЦен.Розничная")
    const filePath = join(projectDir, "Перечисление", "ВидыЦен", "Свойства.yaml")
    const valueEntries: ProjectValueIndexEntry[] = [
      { canonical: projectValueIndexKey(target), target, result: { ok: true, filePath } },
    ]
    const index = createProjectReferenceIndex({
      projectDir,
      snapshot: createProjectReferenceSnapshot({
        objectIndexEntries: [],
        memberIndexEntries: [],
        valueIndexEntries: valueEntries,
        pendingReferences: [],
      }),
    })

    expect(
      index.resolve({
        filePath,
        yamlPath: ["Поле"],
        canonical: "Enum.ВидыЦен.EnumValue.Розничная",
        target,
        constraint: { kind: "object" },
      }),
    ).toEqual({ ok: true })
    expect(index.stats()).toMatchObject({ hits: 1, misses: 0, unsupported: 0, fallbacks: 0 })
  })

  it("validates pending references without fallback", () => {
    const projectDir = "/tmp/nkdk-project"
    const target = memberTarget("Справочник.Номенклатура.Реквизит.Артикул")
    const filePath = join(projectDir, "Справочник", "Номенклатура", "Свойства.yaml")
    const snapshot = createProjectReferenceSnapshot({
      objectIndexEntries: [],
      memberIndexEntries: [{ canonical: projectMemberIndexKey(target), target, result: { ok: true, filePath } }],
      valueIndexEntries: [],
      pendingReferences: [
        {
          filePath,
          yamlPath: ["Поле"],
          canonical: "Catalog.Номенклатура.Attribute.Артикул",
          target,
          constraint: { kind: "member", owner: "explicit" },
        },
      ],
    })
    const index = createProjectReferenceIndex({ projectDir, snapshot })

    expect(validatePendingReferencesWithIndex({ index, references: snapshot.pendingReferences })).toEqual({
      diagnostics: [],
      stats: { hits: 1, misses: 0, conflicts: 0, filterFailures: 0, unsupported: 0, fallbacks: 0 },
    })
  })

  it("applies member filters from indexed field details", () => {
    const projectDir = "/tmp/nkdk-project"
    const booleanTarget = memberTarget("Документ.АвансовыйОтчет.Реквизит.Провести")
    const tableTarget = memberTarget("Документ.АвансовыйОтчет.ТабличнаяЧасть.Товары.Реквизит.Использовать")
    const filePath = join(projectDir, "Документ", "АвансовыйОтчет", "Свойства.yaml")
    const index = createProjectReferenceIndex({
      projectDir,
      snapshot: createProjectReferenceSnapshot({
        objectIndexEntries: [],
        memberIndexEntries: [
          {
            canonical: projectMemberIndexKey(booleanTarget),
            target: booleanTarget,
            result: { ok: true, filePath, details: { kind: "attribute", typeInfo: { kinds: ["boolean"] } } },
          },
          {
            canonical: projectMemberIndexKey(tableTarget),
            target: tableTarget,
            result: { ok: true, filePath, details: { kind: "attribute", typeInfo: { kinds: ["boolean"] } } },
          },
        ],
        valueIndexEntries: [],
        pendingReferences: [],
      }),
    })

    expect(
      index.resolve({
        filePath,
        yamlPath: ["Поле"],
        canonical: projectMemberIndexKey(booleanTarget),
        target: booleanTarget,
        constraint: { kind: "member", owner: "explicit", filters: [{ kind: "hasType", type: "boolean" }] },
      }),
    ).toEqual({ ok: true })
    expect(
      index.resolve({
        filePath,
        yamlPath: ["Поле"],
        canonical: projectMemberIndexKey(tableTarget),
        target: tableTarget,
        constraint: {
          kind: "member",
          owner: "explicit",
          filters: [{ kind: "directMember" }, { kind: "hasType", type: "boolean" }],
        },
      }),
    ).toMatchObject({
      ok: false,
      reason: "filter",
      diagnostics: [expect.objectContaining({ message: expect.stringContaining("прямые члены текущего объекта") })],
    })
    expect(index.stats()).toMatchObject({ hits: 1, filterFailures: 1, fallbacks: 0 })
  })

  it("applies style item type filter to object entries", () => {
    const projectDir = "/tmp/nkdk-project"
    const target = objectTarget("ЭлементСтиля.ОсновнойШрифт")
    const filePath = join(projectDir, "ЭлементСтиля", "ОсновнойШрифт.yaml")
    const index = createProjectReferenceIndex({
      projectDir,
      snapshot: createProjectReferenceSnapshot({
        objectIndexEntries: [
          {
            canonical: projectObjectIndexKey(target),
            target,
            result: { ok: true, filePath, details: { model: { type: "Font" } } },
          },
        ],
        memberIndexEntries: [],
        valueIndexEntries: [],
        pendingReferences: [],
      }),
    })

    expect(
      index.resolve({
        filePath,
        yamlPath: ["Шрифт"],
        canonical: "StyleItem.ОсновнойШрифт",
        target,
        constraint: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] },
      }),
    ).toEqual({ ok: true })
    expect(
      index.resolve({
        filePath,
        yamlPath: ["Цвет"],
        canonical: "StyleItem.ОсновнойШрифт",
        target,
        constraint: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
      }),
    ).toMatchObject({ ok: false, reason: "filter" })
  })

  it("does not duplicate index arrays when lookup maps are enough for worker snapshot", () => {
    const target = memberTarget("Справочник.Номенклатура.Реквизит.Артикул")
    const snapshot = createProjectReferenceSnapshot({
      objectIndexEntries: [],
      memberIndexEntries: [{ canonical: projectMemberIndexKey(target), target, result: { ok: true, filePath: "/tmp/Свойства.yaml" } }],
      valueIndexEntries: [],
      pendingReferences: [],
    })

    expect(snapshot.memberIndexByKey[projectMemberIndexKey(target)]).toBeDefined()
    expect("memberIndex" in snapshot).toBe(false)
    expect(snapshot.stats.snapshotBytes).toBeGreaterThan(0)
  })
})

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
