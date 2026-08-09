import { describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"
import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import { registerCoreMetadata } from "../composition/coreMetadata"
import { yamlScalarTagAt } from "../../yaml/scalarTags"
import type { ImportedDependentPropertyCandidate } from "../ruleRuntime/property/importYamlTypes"
import {
  normalizeImportedDependentItems,
  partitionImportedDependentItems,
  preserveDeferredDependentRawXML,
} from "./dependentItems"

registerCoreMetadata()

describe("normalizeImportedDependentItems", () => {
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

  it("откладывает DefinedType и удаляет одиночную пустую ссылку после lookup", () => {
    const attribute = {
      Тип: "ОпределяемыйТип.АвторДействия",
      ЗначениеЗаполнения: "Справочник.Пользователи.ПустаяСсылка",
    }
    const yaml = { Реквизиты: { Автор: attribute } }
    const imported = {
      ...candidate("MetadataAttribute", ["Реквизиты", "Автор"], "Автор"),
      logicalAddress: "Справочник.Товары.Attribute.Автор.Property.fillValue",
      xmlValue: { "_xsi:type": "xr:DesignTimeRef", "#text": "Catalog.Пользователи.EmptyRef" },
    }
    const collector = createConfigurationIndexCollector()
    const partitioned = partitionImportedDependentItems({
      yaml,
      rule: MetadataCatalogRules,
      candidates: [imported],
      owner: { dir: "Справочник", name: "Товары" },
    })

    expect(partitioned.immediate).toEqual([])
    expect(partitioned.deferred).toEqual([imported])
    preserveDeferredDependentRawXML({ candidates: partitioned.deferred, collector })
    expect(normalizeImportedDependentItems({
      yaml,
      rule: MetadataCatalogRules,
      candidates: partitioned.deferred,
      owner: { dir: "Справочник", name: "Товары" },
      definedTypeLookup: () => ({ status: "ok", type: { type: ["CatalogRef.Пользователи"] } }),
      preserveRawXML: false,
    })).toBe(1)
    expect(attribute).not.toHaveProperty("ЗначениеЗаполнения")
    expect(collector.fragment("Справочник/Товары/Свойства.yaml").entities).toContainEqual(
      expect.objectContaining({ logicalAddress: imported.logicalAddress }),
    )
  })

  it.each([
    ["несовместимую ссылку", "Справочник.Пользователи.ПустаяСсылка", "CatalogRef.Сотрудники", true],
    ["содержательную ссылку", "Справочник.Пользователи.Администратор", "CatalogRef.Пользователи", false],
  ] as const)("нормализует %s после DefinedType lookup", (_name, fillValue, sourceType, tagged) => {
    const attribute = normalizeDefinedTypeAttribute(fillValue, () => ({ status: "ok", type: { type: [sourceType] } }))
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения") === "xml").toBe(tagged)
  })

  it("не маркирует неразрешимый DefinedType автоматически", () => {
    const attribute = normalizeDefinedTypeAttribute(
      "Справочник.Пользователи.ПустаяСсылка",
      () => ({ status: "unresolved", reason: "не найден определяемый тип" }),
    )
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBeUndefined()
  })

  it("сохраняет непустое допустимое значение для последующей локальной валидации", () => {
    const fillValue = "А"
    const attribute = { Тип: "Строка(10)", ЗначениеЗаполнения: fillValue }

    expect(normalizeMetadataAttribute(attribute)).toBe(0)
    expect(attribute).toHaveProperty("ЗначениеЗаполнения", fillValue)
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBeUndefined()
  })

  it("маркирует несовместимое значение как XML-исключение", () => {
    const attribute: Record<string, unknown> = { Тип: "Строка(10)", ЗначениеЗаполнения: 1 }

    expect(normalizeMetadataAttribute(attribute)).toBe(0)
    expect(attribute.ЗначениеЗаполнения).toBe("!xml 1")
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBe("xml")
  })

  it("маркирует запрещённое значение стандартного реквизита", () => {
    const attribute: Record<string, unknown> = { ЗначениеЗаполнения: "Ложь" }
    const yaml = { СтандартныеРеквизиты: { Предопределенный: attribute } }

    expect(normalizeImportedDependentItems({
      yaml,
      rule: MetadataCatalogRules,
      candidates: [candidate(
        "StandardAttributeDescription",
        ["СтандартныеРеквизиты", "Предопределенный"],
        "Предопределенный"
      )],
      collector: createConfigurationIndexCollector(),
      owner: { dir: "Справочник", name: "Товары" },
    })).toBe(0)
    expect(attribute.ЗначениеЗаполнения).toBe("!xml Ложь")
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBe("xml")
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
      candidates: [candidate(itemType, [collection, itemName], itemName)],
      collector: createConfigurationIndexCollector(),
      owner: { dir: "Справочник", name: "Товары" },
    })).toBe(0)
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBeUndefined()
  })

  it.each(["", " ", "   "])("удаляет неявный код %j и сохраняет точный XML", (fillValue) => {
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

    expect(removed).toBe(1)
    expect(yaml.СтандартныеРеквизиты.Код).not.toHaveProperty("ЗначениеЗаполнения")
    expect(collector.fragment("Справочник/Товары/Свойства.yaml").entities).toContainEqual({
      logicalAddress,
      sourceProjectPath: "Справочник/Товары/Свойства.yaml",
      xml: { xsiType: "xs:string", xmlText: fillValue },
    })
  })

  it("удаляет начальную дату и сохраняет точный XML в снимке", () => {
    const attribute = { Тип: "ДатаВремя", ЗначениеЗаполнения: "01.01.0001 00:00:00" }
    const yaml = { Реквизиты: { Момент: attribute } }
    const collector = createConfigurationIndexCollector()

    const removed = normalizeImportedDependentItems({
      yaml,
      rule: MetadataCatalogRules,
      candidates: [{
        ...candidate("MetadataAttribute", ["Реквизиты", "Момент"], "Момент"),
        logicalAddress: "Справочник.Товары.Attribute.Момент.Property.fillValue",
        xmlValue: { "_xsi:type": "xs:dateTime", "#text": "0001-01-01T00:00:00" },
      }],
      collector,
      owner: { dir: "Справочник", name: "Товары" },
    })

    expect(removed).toBe(1)
    expect(attribute).not.toHaveProperty("ЗначениеЗаполнения")
    expect(collector.fragment("Справочник/Товары/Свойства.yaml").entities).toContainEqual({
      logicalAddress: "Справочник.Товары.Attribute.Момент.Property.fillValue",
      sourceProjectPath: "Справочник/Товары/Свойства.yaml",
      xml: { xsiType: "xs:dateTime", xmlText: "0001-01-01T00:00:00" },
    })
  })

  it.each([
    [
      "xsi:nil",
      "Справочник.Контрагенты",
      "Справочник.Контрагенты.ПустаяСсылка",
      { "_xsi:nil": true },
      { xsiNil: true },
    ],
    ["явный пустой узел", "Строка(10)", "", {}, { explicitEmpty: true }],
  ])("сохраняет XML-форму %s только при удалении", (_name, type, fillValue, xmlValue, expectedXml) => {
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
    expect(collector.fragment("Справочник/Товары/Свойства.yaml").entities).toContainEqual({
      logicalAddress: "Справочник.Товары.Attribute.Получатель.Property.fillValue",
      sourceProjectPath: "Справочник/Товары/Свойства.yaml",
      xml: expectedXml,
    })
  })

  it("представляет пустой DesignTimeRef точным !xml sentinel без snapshot", () => {
    const attribute: Record<string, unknown> = {
      Тип: "Справочник.Контрагенты",
      ЗначениеЗаполнения: ".",
    }
    const collector = createConfigurationIndexCollector()
    normalizeImportedDependentItems({
      yaml: { Реквизиты: { Получатель: attribute } },
      rule: MetadataCatalogRules,
      candidates: [{
        ...candidate("MetadataAttribute", ["Реквизиты", "Получатель"], "Получатель"),
        logicalAddress: "Справочник.Товары.Attribute.Получатель.Property.fillValue",
        xmlValue: { "_xsi:type": "xr:DesignTimeRef" },
      }],
      collector,
      owner: { dir: "Справочник", name: "Товары" },
    })

    expect(attribute.ЗначениеЗаполнения).toBe("!xml DesignTimeRef")
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBe("xml")
    expect(collector.fragment("Справочник/Товары/Свойства.yaml").entities).toEqual([])
  })
})

function candidate(
  itemType: string,
  itemYamlPath: readonly (string | number)[],
  itemName: string,
): ImportedDependentPropertyCandidate {
  return {
    itemType,
    itemName,
    itemYamlPath,
    propertyKey: "fillValue",
    yamlPath: [...itemYamlPath, "ЗначениеЗаполнения"],
    xmlValue: { "_xsi:type": "xs:string" },
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
