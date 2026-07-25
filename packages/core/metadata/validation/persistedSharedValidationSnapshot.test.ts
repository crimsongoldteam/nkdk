import { describe, expect, it } from "vitest"
import { parseMetadataTargetFromYAML } from "../commonObjects/metadataTargets"
import { createOwnerMetadataCacheFromSharedValidationSnapshot } from "./dataPath/sharedOwnerCache"
import { projectObjectIndexKey } from "./projectReferenceIndex"
import { createSharedValidationSnapshot } from "./sharedValidationSnapshot"
import type { ValidationObjectRecord } from "./projectValidationTypes"
import {
  restoreSharedValidationSnapshot,
  serializeSharedValidationSnapshot,
} from "./persistedSharedValidationSnapshot"

describe("persisted shared validation snapshot", () => {
  it("round-trips local reference and owner buffers without sharing mutable bytes", () => {
    const target = objectTarget("Справочник.Номенклатура")
    const filePath = "Справочник/Номенклатура/Свойства.yaml"
    const snapshot = createSharedValidationSnapshot({
      records: [catalogRecord(filePath)],
      filePaths: [filePath],
      objectIndexEntries: [
        {
          canonical: projectObjectIndexKey(target),
          target,
          result: { ok: true, filePath },
        },
      ],
    })

    const persisted = serializeSharedValidationSnapshot(snapshot)
    const restored = restoreSharedValidationSnapshot(persisted)
    persisted.reference.fill(0)
    persisted.ownerStrings.fill(0)
    persisted.ownerTable.fill(0)

    expect(restored.reference.stats).toEqual(snapshot.reference.stats)
    const cache = createOwnerMetadataCacheFromSharedValidationSnapshot({
      projectDir: "/project",
      snapshot: restored,
    })
    expect(cache.get({ kind: "Справочник", name: "Номенклатура" })).toMatchObject({
      status: "ok",
      owner: {
        filePath,
        fieldIndex: {
          fields: expect.any(Map),
        },
      },
    })
  })

  it.each(["reference", "ownerStrings", "ownerTable"] as const)(
    "rejects a corrupted %s buffer before constructing shared views",
    (part) => {
      const snapshot = createSharedValidationSnapshot({
        records: [],
        filePaths: [],
      })
      const persisted = serializeSharedValidationSnapshot(snapshot)
      persisted[part][0] = 0

      expect(() => restoreSharedValidationSnapshot(persisted)).toThrow(
        "Некорректный сохранённый validation snapshot"
      )
    }
  )
})

function objectTarget(value: string) {
  const parsed = parseMetadataTargetFromYAML({ value, constraint: { kind: "object" } })
  if (!parsed.ok || parsed.target.kind !== "object") throw new Error(value)
  return parsed.target
}

function catalogRecord(filePath: string): ValidationObjectRecord {
  return {
    filePath,
    projectPath: filePath,
    kind: "properties",
    owner: { dir: "Справочник", name: "Номенклатура" },
    ownerRef: { kind: "Справочник", name: "Номенклатура" },
    fieldIndex: {
      fields: new Map([
        [
          "Артикул",
          {
            name: "Артикул",
            kind: "attribute",
            sourceCollection: "attributes",
            typeInfo: { kinds: ["scalar"] as const, nextTypes: [], sourceText: "String" },
          },
        ],
      ]),
      standardAttributeAliases: new Map(),
      diagnostics: [],
    },
    importDiagnostics: [],
  }
}
