import { describe, expect, it } from "vitest"
import { ClientApplicationFormRules } from "../forms/clientApplicationForm/rules"
import type { OperationSnapshotItem } from "./projectSnapshot"
import { createLayeredOwnerMetadataCacheForTests } from "../../tests/layeredOwnerMetadataCache"
import { parseMetadataYaml } from "@nkdk/runtime"
import { yamlScalarTagAt } from "@nkdk/runtime"
import { resolveValidationProjectFile } from "../validation/projectFiles"
import { createValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import type { ResolvedDataPathTarget } from "../validation/dataPath/resolver"
import {
  collectFormDataPathReferencesForItem,
  dataPathTargetMatchesCanonicalPrefix,
  rewriteDataPathSegments,
} from "./dataPathReferences"


describe("rewriteDataPathSegments", () => {
  it("rewrites only the resolved segment", () => {
    expect(rewriteDataPathSegments("Объект.Товары.Артикул", ["Объект", "Товары", "Артикул"], 2, "Код")).toBe(
      "Объект.Товары.Код"
    )
  })

  it("keeps indexed segments syntax around the changed segment", () => {
    expect(rewriteDataPathSegments("Товары[0].Артикул", ["Товары[0]", "Артикул"], 1, "Код")).toBe("Товары[0].Код")
  })

  it("matches object field DataPath targets by canonical prefix", () => {
    const target: ResolvedDataPathTarget = {
      value: "Объект.Артикул",
      segments: ["Объект", "Артикул"],
      segmentIndex: 1,
      typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "string" },
      source: { kind: "objectField", owner: { kind: "Catalog", name: "Товары" }, name: "Артикул" },
    }

    expect(dataPathTargetMatchesCanonicalPrefix(target, "Catalog.Товары.Attribute.Артикул")).toEqual({
      segmentIndex: 1,
    })
  })

  it("сопоставляет цель элемента формы с его логическим адресом", () => {
    const target: ResolvedDataPathTarget = {
      value: "Элементы.Таблица.ТекущиеДанные.Код",
      segments: ["Элементы", "Таблица", "ТекущиеДанные", "Код"],
      segmentIndex: 1,
      typeInfo: { kinds: ["tableSource"], nextTypes: [] },
      source: { kind: "formElement", name: "Таблица" },
    }

    expect(dataPathTargetMatchesCanonicalPrefix(
      target,
      "Catalog.Товары.Form.ФормаСписка.Element.Таблица",
      "Catalog.Товары.Form.ФормаСписка",
    )).toEqual({ segmentIndex: 1 })
  })

  it("разрешает tagged DataPath во внутренних именах и сохраняет тег при изменении", () => {
    const parsed = parseMetadataYaml([
      "Реквизиты:",
      "  Объект:",
      "    Тип: Справочник.Товары",
      "Элементы:",
      "  Поле:",
      "    Вид: ПолеВвода",
      "    ПутьКДанным: !xml Объект.Description",
    ].join("\n"))
    const resource = resolveValidationProjectFile(
      "/project",
      "/project/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
    )
    if (resource === undefined || typeof parsed.data !== "object" || parsed.data === null) {
      throw new Error("Не удалось подготовить форму")
    }
    const fieldIndex = {
      fields: new Map([
        ["Description", {
          name: "Наименование",
          targetName: "Description",
          kind: "standardAttribute" as const,
          typeInfo: { kinds: ["scalar" as const], nextTypes: [], sourceText: "string" },
        }],
      ]),
      standardAttributeAliases: new Map([["Description", "Наименование"]]),
      diagnostics: [],
    }
    const facts = createValidationOwnerFacts({
      ref: { kind: "Справочник", name: "Товары" },
      filePath: "/project/Справочник/Товары/Свойства.yaml",
      fieldIndex,
      model: { itemType: "MetadataCatalog" },
    })
    const item = {
      resource,
      filePath: resource.absolutePath,
      projectPath: resource.projectPath,
      ownerDirPath: "/project/Справочник/Товары",
      parsed,
      yaml: parsed.data as Record<string, unknown>,
      rule: ClientApplicationFormRules,
      kind: "form",
    } satisfies OperationSnapshotItem

    const [reference] = collectFormDataPathReferencesForItem({
      item,
      ownerCache: createLayeredOwnerMetadataCacheForTests({ base: [facts] }),
      targetPrefix: "Catalog.Товары",
    })

    expect(reference?.target.source).toMatchObject({ kind: "objectField", name: "Наименование" })
    reference?.setValue(rewriteDataPathSegments(
      reference.value,
      reference.target.segments,
      reference.segmentIndex,
      "НовоеИмя",
    ))
    const element = (item.yaml.Элементы as Record<string, Record<string, unknown>>).Поле!
    expect(element.ПутьКДанным).toBe("Объект.НовоеИмя")
    expect(yamlScalarTagAt(element, "ПутьКДанным")).toBe("xml")
  })
})
