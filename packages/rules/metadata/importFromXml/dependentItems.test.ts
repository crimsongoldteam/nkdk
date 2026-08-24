import {
createConfigurationIndexCollector,
yamlScalarTagAt
} from "@nkdk/runtime"
import type { ImportedDependentPropertyCandidate } from "@nkdk/runtime/rule-kit"
import { describe,expect,it } from "vitest"
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"
import { ordinaryFillValueItemTypes } from "../commonObjects/fillValue/ordinaryItemTypes"
import {
normalizeImportedDependentItems,
partitionImportedDependentItems,
} from "./dependentItems"


describe("normalizeImportedDependentItems", () => {

  it.each(
    ordinaryFillValueItemTypes.flatMap((itemType) => [
      ["нестрокового", itemType, "Булево", "Ложь"],
      ["составного", itemType, ["Строка", "Булево"], ""],
    ] as const),
  )("не изменяет значение %s %s до общей проверки XML", (_case, itemType, type, fillValue) => {
    const item: Record<string, unknown> = { Тип: type, ЗначениеЗаполнения: fillValue }

    normalizeImportedDependentItems({
      yaml: { Поля: { Поле: item } },
      rule: MetadataCatalogRules,
      candidates: [candidate(itemType, ["Поля", "Поле"], "Поле", { "_xsi:nil": true })],
      owner: { dir: "РегистрСведений", name: "Проба" },
    })

    expect(item).toHaveProperty("ЗначениеЗаполнения", fillValue)
  })

  it.each([
    [{ Тип: "Строка(10)", ЗначениеЗаполнения: "" }],
    [{ ЗначениеЗаполнения: "", Тип: "Строка(10)" }],
  ])("удаляет неявное значение только после построения всего элемента", (attribute) => {
    const yaml = { Реквизиты: { Получатель: attribute } }

    const removed = normalizeImportedDependentItems({
      yaml,
      rule: MetadataCatalogRules,
      candidates: [candidate("MetadataAttribute", ["Реквизиты", "Получатель"], "Получатель")],
      collector: createConfigurationIndexCollector(),
      owner: { dir: "Справочник", name: "Товары" },
    })

    expect(removed).toBe(1)
    expect(attribute).not.toHaveProperty("ЗначениеЗаполнения")
  })

  it.each([
    ["несовместимую ссылку", "Справочник.Пользователи.ПустаяСсылка", "CatalogRef.Сотрудники"],
    ["содержательную ссылку", "Справочник.Пользователи.Администратор", "CatalogRef.Пользователи"],
  ] as const)("не ставит частный тег для случая %s после DefinedType lookup", (_name, fillValue, sourceType) => {
    const attribute = normalizeDefinedTypeAttribute(fillValue, () => ({ status: "ok", type: { type: [sourceType] } }))
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBeUndefined()
  })

  it("не маркирует неразрешимый DefinedType автоматически", () => {
    const attribute = normalizeDefinedTypeAttribute(
      "Справочник.Пользователи.ПустаяСсылка",
      () => ({ status: "unresolved", reason: "не найден определяемый тип" }),
    )
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBeUndefined()
  })

  it.each([
    ["цель есть в компоненте", "found"],
    ["цели нет в компоненте", "missing"],
    ["цель неоднозначна", "ambiguous"],
  ] as const)("не ставит частный тег DesignTimeRef, когда %s", (_name, status) => {
    const attribute = normalizeReferenceAttribute(status)
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBeUndefined()
  })

  it("откладывает именованный DesignTimeRef до компонентного lookup", () => {
    const attribute = referenceAttribute()
    const imported = designTimeRefCandidate()
    const partitioned = partitionCandidate({ Реквизиты: { Получатель: attribute } }, imported)

    expect(partitioned.immediate).toEqual([])
    expect(partitioned.deferred).toEqual([imported])
  })

  it("сохраняет непустое допустимое значение для последующей локальной валидации", () => {
    const fillValue = "А"
    const attribute = { Тип: "Строка(10)", ЗначениеЗаполнения: fillValue }

    expect(normalizeMetadataAttribute(attribute)).toBe(0)
    expect(attribute).toHaveProperty("ЗначениеЗаполнения", fillValue)
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBeUndefined()
  })

  it.each([
    ["unresolved", "MetadataAttribute", "Получатель", { Тип: "НеизвестныйТип", ЗначениеЗаполнения: "текст" }],
    ["notSpecified", "StandardAttributeDescription", "Наименование", { ЗначениеЗаполнения: "текст" }],
  ] as const)("не маркирует %s значение автоматически", (_name, itemType, itemName, source) => {
    const attribute: Record<string, unknown> = { ...source }
    const collection = itemType === "MetadataAttribute" ? "Реквизиты" : "СтандартныеРеквизиты"
    const yaml = { [collection]: { [itemName]: attribute } }

    expect(normalizeImportedDependentItems({
      yaml,
      rule: MetadataCatalogRules,
      candidates: [candidate(itemType, [collection, itemName], itemName, {
        "_xsi:type": "xs:string",
        "#text": "текст",
      })],
      collector: createConfigurationIndexCollector(),
      owner: { dir: "Справочник", name: "Товары" },
    })).toBe(0)
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBeUndefined()
  })

  it.each([" ", "   "])("сохраняет допустимый пробельный код %j без тега", (fillValue) => {
    const yaml = {
      СтандартныеРеквизиты: { Код: { ЗначениеЗаполнения: fillValue } },
    }
    const collector = createConfigurationIndexCollector()
    const logicalAddress = `Справочник.Товары.StandardAttribute.Code.Property.fillValue.${fillValue.length}`

    const removed = normalizeImportedDependentItems({
      yaml,
      rule: MetadataCatalogRules,
      candidates: [{
        ...candidate("StandardAttributeDescription", ["СтандартныеРеквизиты", "Код"], "Код"),
        logicalAddress,
        xmlValue: { "_xsi:type": "xs:string", "#text": fillValue },
      }],
      collector,
      owner: { dir: "Справочник", name: "Товары" },
    })

    expect(removed).toBe(0)
    expect(yaml.СтандартныеРеквизиты.Код.ЗначениеЗаполнения).toBe(fillValue)
    expect(yamlScalarTagAt(yaml.СтандартныеРеквизиты.Код, "ЗначениеЗаполнения")).toBeUndefined()
    expect(collector.fragment("Справочник/Товары/Свойства.yaml").entities).toEqual([])
  })

  it.each([
    [
      "xsi:nil",
      "Справочник.Контрагенты",
      "Справочник.Контрагенты.ПустаяСсылка",
      { "_xsi:nil": true },
    ],
    ["явный пустой узел", "Строка(10)", "", {}],
  ])("не сохраняет XML-форму %s в снимке", (_name, type, fillValue, xmlValue) => {
    const attribute = { Тип: type, ЗначениеЗаполнения: fillValue }
    const yaml = { Реквизиты: { Получатель: attribute } }
    const collector = createConfigurationIndexCollector()

    normalizeImportedDependentItems({
      yaml,
      rule: MetadataCatalogRules,
      candidates: [{
        ...candidate("MetadataAttribute", ["Реквизиты", "Получатель"], "Получатель"),
        logicalAddress: "Справочник.Товары.Attribute.Получатель.Property.fillValue",
        xmlValue,
      }],
      collector,
      owner: { dir: "Справочник", name: "Товары" },
    })

    expect(attribute).not.toHaveProperty("ЗначениеЗаполнения")
    expect(collector.fragment("Справочник/Товары/Свойства.yaml").entities).toEqual([])
  })
})

function candidate(
  itemType: string,
  itemYamlPath: readonly (string | number)[],
  itemName: string,
  xmlValue: unknown = { "_xsi:type": "xs:string" },
): ImportedDependentPropertyCandidate {
  return {
    itemType,
    itemName,
    itemYamlPath,
    propertyKey: "fillValue",
    yamlPath: [...itemYamlPath, "ЗначениеЗаполнения"],
    xmlValue,
    presentInXML: true,
  }
}

function normalizeMetadataAttribute(attribute: Record<string, unknown>): number {
  return normalizeImportedDependentItems({
    yaml: { Реквизиты: { Получатель: attribute } },
    rule: MetadataCatalogRules,
    candidates: [candidate("MetadataAttribute", ["Реквизиты", "Получатель"], "Получатель")],
    collector: createConfigurationIndexCollector(),
    owner: { dir: "Справочник", name: "Товары" },
  })
}

function normalizeDefinedTypeAttribute(
  fillValue: string,
  definedTypeLookup: NonNullable<Parameters<typeof normalizeImportedDependentItems>[0]["definedTypeLookup"]>,
): Record<string, unknown> {
  const attribute: Record<string, unknown> = {
    Тип: "ОпределяемыйТип.АвторДействия",
    ЗначениеЗаполнения: fillValue,
  }
  normalizeImportedDependentItems({
    yaml: { Реквизиты: { Автор: attribute } },
    rule: MetadataCatalogRules,
    candidates: [candidate("MetadataAttribute", ["Реквизиты", "Автор"], "Автор")],
    owner: { dir: "Справочник", name: "Товары" },
    definedTypeLookup,
    preserveRawXML: false,
  })
  return attribute
}

function normalizeReferenceAttribute(
  status: "found" | "missing" | "ambiguous",
): Record<string, unknown> {
  const attribute = referenceAttribute()
  normalizeImportedDependentItems({
    yaml: { Реквизиты: { Получатель: attribute } },
    rule: MetadataCatalogRules,
    candidates: [designTimeRefCandidate()],
    owner: { dir: "Справочник", name: "Товары" },
    metadataTargetLookup: () => status,
    preserveRawXML: false,
  })
  return attribute
}

function referenceAttribute(): Record<string, unknown> {
  return {
    Тип: "Справочник.СправочникРеквизит",
    ЗначениеЗаполнения: "Справочник.СправочникРеквизит.ПредопредленноеЗначение",
  }
}

function designTimeRefCandidate(): ImportedDependentPropertyCandidate {
  return {
    ...candidate("MetadataAttribute", ["Реквизиты", "Получатель"], "Получатель"),
    xmlValue: {
      "_xsi:type": "xr:DesignTimeRef",
      "#text": "Catalog.СправочникРеквизит.Predefined.ПредопредленноеЗначение",
    },
  }
}

function partitionCandidate(yaml: unknown, imported: ImportedDependentPropertyCandidate) {
  return partitionImportedDependentItems({
    yaml,
    rule: MetadataCatalogRules,
    candidates: [imported],
    owner: { dir: "Справочник", name: "Товары" },
  })
}
