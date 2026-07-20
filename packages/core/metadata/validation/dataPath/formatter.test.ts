import { describe, expect, it } from "vitest"
import type { TypeDescription } from "../../commonObjects/typeDescription/types"
import type { FormAttribute } from "../../forms/commonObjects/formAttribute/types"
import { MetadataCatalogRules } from "../../appliedObjects/metadataCatalog/rules"
import type { MetadataItem, MetadataItemRule } from "../../orchestration/property/types"
import { parseMetadataYaml } from "../../../yaml/parseMetadataYaml"
import { buildFormDataPathIndex, type FormDataPathIndex } from "./formIndex"
import { formatDataPathStandardMembers } from "./formatter"
import { buildObjectFieldIndex } from "./objectFields"
import type { OwnerMetadata, OwnerMetadataCache, OwnerMetadataResult } from "./ownerCache"

describe("formatDataPathStandardMembers", () => {
  it("keeps ValueTable columns unchanged in both directions", () => {
    const index = indexWithAttributes([
      attribute("Список", { type: ["ValueTable"] }, [column("Код", { type: ["string"] })]),
    ])

    expect(
      formatDataPathStandardMembers({
        value: "Список.Код",
        direction: "yaml-to-internal",
        index,
        ownerCache: ownerCache([]),
      })
    ).toBe("Список.Код")
    expect(
      formatDataPathStandardMembers({
        value: "Список.Код",
        direction: "internal-to-yaml",
        index,
        ownerCache: ownerCache([]),
      })
    ).toBe("Список.Код")
  })

  it("formats object standard members in both directions", () => {
    const index = indexWithAttributes([attribute("Объект", { type: ["CatalogRef.Товары"] })])
    const owners = ownerCache([
      owner({
        ref: { kind: "Справочник", name: "Товары" },
        rule: MetadataCatalogRules,
        model: { itemType: "MetadataCatalog" },
      }),
    ])

    expect(
      formatDataPathStandardMembers({
        value: "Объект.Код",
        direction: "yaml-to-internal",
        index,
        ownerCache: owners,
      })
    ).toBe("Объект.Code")
    expect(
      formatDataPathStandardMembers({
        value: "Объект.Code",
        direction: "internal-to-yaml",
        index,
        ownerCache: owners,
      })
    ).toBe("Объект.Код")
  })

  it("preserves an unresolved data path and reports one import warning", () => {
    const diagnostics: unknown[] = []

    const formatted = formatDataPathStandardMembers({
      value: "Неизвестный.Переход",
      direction: "internal-to-yaml",
      index: indexWithAttributes([]),
      ownerCache: ownerCache([]),
      diagnosticSink: {
        targetProjectPath: "Справочник/Товары/Формы/Форма/Форма.yaml",
        append: (diagnostic) => diagnostics.push(diagnostic),
      },
    })

    expect(formatted).toBe("Неизвестный.Переход")
    expect(diagnostics).toEqual([
      {
        severity: "warning",
        code: "unresolved_data_path",
        targetProjectPath: "Справочник/Товары/Формы/Форма/Форма.yaml",
        value: "Неизвестный.Переход",
        message: "Не удалось преобразовать ПутьКДанным: Неизвестный.Переход",
      },
    ])
  })
})

function indexWithAttributes(attributes: FormAttribute[]): FormDataPathIndex {
  return buildFormDataPathIndex({
    filePath: "/tmp/form.yaml",
    parsed: parseMetadataYaml("Реквизиты: {}\n"),
    form: {
      itemType: "ClientApplicationForm",
      attributes,
    } as never,
  })
}

function attribute(
  name: string,
  type: TypeDescription | undefined,
  columns: FormAttribute["columns"] = []
): FormAttribute {
  return {
    itemType: "FormAttribute",
    name,
    ...(type !== undefined ? { type } : {}),
    columns,
  } as FormAttribute
}

function column(name: string, type: TypeDescription): NonNullable<FormAttribute["columns"]>[number] {
  return {
    itemType: "FormAttributeColumn",
    name,
    type,
  } as NonNullable<FormAttribute["columns"]>[number]
}

function ownerCache(owners: OwnerMetadata[]): OwnerMetadataCache {
  const byKey = new Map(owners.map((item) => [ownerKey(item.ref), item]))

  return {
    listRefs(kind) {
      return owners.map((item) => item.ref).filter((ref) => ref.kind === kind)
    },
    get(ref): OwnerMetadataResult {
      const found = byKey.get(ownerKey(ref))
      if (found !== undefined) return { status: "ok", owner: found }
      return {
        status: "not-found",
        diagnostics: [
          {
            filePath: "/tmp/Свойства.yaml",
            line: 1,
            col: 1,
            message: "Не найден владелец",
            severity: "error",
            source: "cross-file",
          },
        ],
      }
    },
  }
}

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

function ownerKey(ref: OwnerMetadata["ref"]): string {
  return `${ref.kind}:${ref.name ?? ""}`
}
