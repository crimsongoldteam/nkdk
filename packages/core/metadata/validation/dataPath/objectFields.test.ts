import { describe, expect, it } from "vitest"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { MetadataAccumulationRegisterRules } from "~/metadata/appliedObjects/metadataAccumulationRegister/rules"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { MetadataDocumentRules } from "~/metadata/appliedObjects/metadataDocument/rules"
import { MetadataInformationRegisterRules } from "~/metadata/appliedObjects/metadataInformationRegister/rules"
import type { MetadataItem } from "~/metadata/orchestration/property/types"
import { parseMetadataYaml } from "~/yaml/parseMetadataYaml"
import type { OwnerMetadata } from "./ownerCache"
import { buildObjectFieldIndex, validateObjectFieldSegment } from "./objectFields"

describe("buildObjectFieldIndex", () => {
  it("indexes catalog attributes and standard attributes", () => {
    const index = buildObjectFieldIndex(
      owner({
        ref: { kind: "Справочник", name: "Номенклатура" },
        rule: MetadataCatalogRules,
        model: {
          itemType: "MetadataCatalog",
          attributes: [{ name: "Артикул", type: { type: ["string"] } }],
        },
      }),
    )

    expect(index.fields.get("Артикул")).toMatchObject({
      name: "Артикул",
      kind: "attribute",
      sourceCollection: "attributes",
      typeInfo: { kinds: ["scalar"], sourceText: "string" },
    })
    expect(index.fields.get("Ссылка")).toMatchObject({
      name: "Ссылка",
      kind: "standardAttribute",
      typeInfo: {
        kinds: ["object"],
        nextTypes: [{ kind: "Справочник", name: "Номенклатура" }],
      },
    })
    expect(index.fields.get("Наименование")).toMatchObject({
      name: "Наименование",
      kind: "standardAttribute",
    })
  })

  it("indexes document standard attributes by YAML names", () => {
    const index = buildObjectFieldIndex(
      owner({
        ref: { kind: "Документ", name: "Заказ" },
        rule: MetadataDocumentRules,
        model: { itemType: "MetadataDocument" },
      }),
    )

    expect(index.fields.get("Дата")).toMatchObject({ name: "Дата", kind: "standardAttribute" })
    expect(index.fields.get("Номер")).toMatchObject({ name: "Номер", kind: "standardAttribute" })
    expect(index.fields.get("Ссылка")?.typeInfo.nextTypes).toEqual([{ kind: "Документ", name: "Заказ" }])
  })

  it("uses model-dependent standard attribute names when rule provides them", () => {
    const index = buildObjectFieldIndex(
      owner({
        ref: { kind: "РегистрНакопления", name: "Обороты" },
        rule: MetadataAccumulationRegisterRules,
        model: {
          itemType: "MetadataAccumulationRegister",
          registerType: "Turnovers",
        },
      }),
    )

    expect(index.fields.get("ВидДвижения")).toBeUndefined()
    expect(index.fields.get("Активность")).toMatchObject({
      name: "Активность",
      kind: "standardAttribute",
    })
  })

  it("indexes register dimensions, resources and attributes", () => {
    const index = buildObjectFieldIndex(
      owner({
        ref: { kind: "РегистрСведений", name: "Остатки" },
        rule: MetadataInformationRegisterRules,
        model: {
          itemType: "MetadataInformationRegister",
          attributes: [{ name: "Комментарий", type: { type: ["string"] } }],
          dimensions: [{ name: "Склад", type: { type: ["CatalogRef.Склады"] } }],
          resources: [{ name: "Количество", type: { type: ["decimal"] } }],
        },
      }),
    )

    expect(index.fields.get("Комментарий")).toMatchObject({ kind: "attribute" })
    expect(index.fields.get("Склад")).toMatchObject({
      kind: "dimension",
      typeInfo: {
        kinds: ["object"],
        nextTypes: [{ kind: "Справочник", name: "Склады" }],
      },
    })
    expect(index.fields.get("Количество")).toMatchObject({ kind: "resource" })
  })

  it("builds tabular section table source with columns and row standard attributes", () => {
    const index = buildObjectFieldIndex(
      owner({
        ref: { kind: "Документ", name: "Заказ" },
        rule: MetadataDocumentRules,
        model: {
          itemType: "MetadataDocument",
          tabularSections: [
            {
              itemType: "MetadataTabularSection",
              name: "Товары",
              attributes: [{ name: "Номенклатура", type: { type: ["CatalogRef.Номенклатура"] } }],
            },
          ],
        },
      }),
    )

    const table = index.fields.get("Товары")
    expect(table).toMatchObject({
      name: "Товары",
      kind: "tabularSection",
      typeInfo: {
        kinds: ["tableSource"],
        table: { kind: "TabularSection", owner: { kind: "Документ", name: "Заказ" }, name: "Товары" },
      },
      tableSource: {
        hasColumns: true,
      },
    })
    expect(table?.tableSource?.columns.get("Номенклатура")).toMatchObject({
      name: "Номенклатура",
      typeInfo: { nextTypes: [{ kind: "Справочник", name: "Номенклатура" }] },
    })
    expect(table?.tableSource?.columns.get("НомерСтроки")).toMatchObject({
      name: "НомерСтроки",
      kind: "standardAttribute",
    })
  })

  it("allows object traversal through Ссылка.Ссылка.Номер by keeping the same owner ref", () => {
    const index = buildObjectFieldIndex(
      owner({
        ref: { kind: "Документ", name: "Заказ" },
        rule: MetadataDocumentRules,
        model: { itemType: "MetadataDocument" },
      }),
    )

    const firstRef = index.fields.get("Ссылка")?.typeInfo.nextTypes[0]
    const secondRef = firstRef ? buildObjectFieldIndex(owner({ ref: firstRef, rule: MetadataDocumentRules })).fields.get("Ссылка") : undefined

    expect(firstRef).toEqual({ kind: "Документ", name: "Заказ" })
    expect(secondRef?.typeInfo.nextTypes).toEqual([{ kind: "Документ", name: "Заказ" }])
    expect(index.fields.get("Номер")).toMatchObject({ name: "Номер" })
  })
})

describe("validateObjectFieldSegment", () => {
  it("rejects platform names in ordinary YAML paths and accepts YAML names", () => {
    const parsed = parseMetadataYaml("ПутьКДанным: Объект.Ref\n")

    expect(
      validateObjectFieldSegment({
        owner: owner({ ref: { kind: "Справочник", name: "Номенклатура" } }),
        segment: "Ref",
        filePath: "/tmp/form.yaml",
        parsed,
        yamlPath: ["ПутьКДанным"],
      }),
    ).toEqual([
      expect.objectContaining({
        filePath: "/tmp/form.yaml",
        line: 1,
        col: 1,
        source: "structure",
        severity: "error",
        path: "/ПутьКДанным",
      }),
    ])

    expect(
      validateObjectFieldSegment({
        owner: owner({ ref: { kind: "Справочник", name: "Номенклатура" } }),
        segment: "Ссылка",
        filePath: "/tmp/form.yaml",
        parsed,
        yamlPath: ["ПутьКДанным"],
      }),
    ).toEqual([])
  })
})

function owner(params: {
  ref?: OwnerMetadata["ref"]
  rule?: MetadataItemRule
  model?: MetadataItem & Record<string, unknown>
}): OwnerMetadata {
  const rule = params.rule ?? MetadataCatalogRules
  const ownerWithoutIndex = {
    ref: params.ref ?? { kind: "Справочник", name: "Номенклатура" },
    filePath: "/tmp/Свойства.yaml",
    model: params.model ?? { itemType: rule.itemType },
    rule,
    spec: {
      kind: "catalog",
      dir: "Справочник",
      rule,
      exportSchema: () => ({ type: "object" }) as never,
      importModel: () => undefined,
    },
  }

  return {
    ...ownerWithoutIndex,
    fieldIndex: buildObjectFieldIndex(ownerWithoutIndex),
  }
}
