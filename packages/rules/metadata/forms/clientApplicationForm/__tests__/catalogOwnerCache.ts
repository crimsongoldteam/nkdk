import type { MetadataItem } from "@nkdk/runtime/rule-kit"
import { MetadataCatalogRules } from "../../../appliedObjects/metadataCatalog/rules"
import { buildObjectFieldIndex } from "../../../validation/dataPath/objectFields"
import type {
  OwnerMetadata,
  OwnerMetadataCache,
  OwnerMetadataResult,
} from "../../../validation/dataPath/ownerCache"
import { createValidationOwnerFacts } from "../../../validation/dataPath/ownerFacts"

export function catalogOwnerCache(): OwnerMetadataCache {
  const owner = catalogOwner()
  return {
    listRefs: (kind) => (kind === owner.ref.kind ? [owner.ref] : []),
    get(ref): OwnerMetadataResult {
      return ref.kind === owner.ref.kind && ref.name === owner.ref.name
        ? { status: "ok", owner }
        : {
            status: "not-found",
            diagnostics: [{
              filePath: "/tmp/Свойства.yaml",
              line: 1,
              col: 1,
              message: "Не найден владелец",
              severity: "error",
              source: "cross-file",
            }],
          }
    },
  }
}

function catalogOwner(): OwnerMetadata {
  const ref = { kind: "СправочникОбъект", name: "Товары" }
  const filePath = "/tmp/Справочники/Товары/Свойства.yaml"
  const emptyFieldIndex = { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] }
  const model = {
    itemType: "MetadataCatalog",
    attributes: [{ name: "Комментарий", type: { type: ["string"] } }],
    tabularSections: [{
      name: "Таблица",
      attributes: [
        { name: "Колонка", type: { type: ["string"] } },
        { name: "Наименование", type: { type: ["string"] } },
        { name: "БезПрефикса", type: { type: ["string"] } },
        { name: "НоваяКолонка", type: { type: ["string"] } },
      ],
    }],
  } as MetadataItem & Record<string, unknown>
  const facts = createValidationOwnerFacts({
    ref,
    filePath,
    fieldIndex: emptyFieldIndex,
    model,
  })
  const ownerWithoutIndex = {
    ref,
    filePath,
    facts,
    rule: MetadataCatalogRules,
    spec: {
      kind: "catalog",
      dir: "Справочник",
      rule: MetadataCatalogRules,
      exportSchema: () => ({ type: "object" }) as never,
    },
  }
  const fieldIndex = buildObjectFieldIndex(ownerWithoutIndex)
  return { ...ownerWithoutIndex, facts: { ...facts, fieldIndex }, fieldIndex }
}
