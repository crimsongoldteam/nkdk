import { describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"
import {
  createConfigurationIndexCollector,
  importFromYAML,
  xmlAnomalyTagPayload,
  yamlScalarTagAt,
} from "@nkdk/runtime"
import type { ImportedDependentPropertyCandidate } from "@nkdk/runtime/rule-kit"
import {
  normalizeImportedDependentItems,
  partitionImportedDependentItems,
} from "./dependentItems"
import { ordinaryFillValueItemTypes } from "../commonObjects/fillValue/ordinaryItemTypes"


describe("normalizeImportedDependentItems", () => {
  it.each(ordinaryFillValueItemTypes)("сохраняет строковый xsi:nil через !xml/value Nil у %s", (itemType) => {
    const item = { Тип: "Строка", ЗначениеЗаполнения: "" }
    const yaml = { Поля: { Поле: item } }

    normalizeImportedDependentItems({
      yaml,
      rule: MetadataCatalogRules,
      candidates: [candidate(itemType, ["Поля", "Поле"], "Поле", { "_xsi:nil": true })],
      owner: { dir: "РегистрСведений", name: "Проба" },
    })

    expect(item.ЗначениеЗаполнения).toBe("!xml/value Nil")
    expect(yamlScalarTagAt(item, "ЗначениеЗаполнения")).toBe("xml/value")
  })

  it.each(
    ordinaryFillValueItemTypes.flatMap((itemType) => [
      ["нестрокового", itemType, "Булево", "Ложь"],
      ["составного", itemType, ["Строка", "Булево"], ""],
    ] as const),
  )("не сохраняет xsi:nil у %s %s", (_case, itemType, type, fillValue) => {
    const item: Record<string, unknown> = { Тип: type, ЗначениеЗаполнения: fillValue }

    normalizeImportedDependentItems({
      yaml: { Поля: { Поле: item } },
      rule: MetadataCatalogRules,
      candidates: [candidate(itemType, ["Поля", "Поле"], "Поле", { "_xsi:nil": true })],
      owner: { dir: "РегистрСведений", name: "Проба" },
    })

    expect(item).not.toHaveProperty("ЗначениеЗаполнения")
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
    const partitioned = partitionCandidate(yaml, imported)

    expect(partitioned.immediate).toEqual([])
    expect(partitioned.deferred).toEqual([imported])
    expect(normalizeImportedDependentItems({
      yaml,
      rule: MetadataCatalogRules,
      candidates: partitioned.deferred,
      owner: { dir: "Справочник", name: "Товары" },
      definedTypeLookup: () => ({ status: "ok", type: { type: ["CatalogRef.Пользователи"] } }),
      preserveRawXML: false,
    })).toBe(0)
    expect(attribute.ЗначениеЗаполнения).toBe("!xml/value Справочник.Пользователи.ПустаяСсылка")
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBe("xml/value")
    expect(collector.fragment("Справочник/Товары/Свойства.yaml").entities).toEqual([])
  })

  it.each([
    ["несовместимую ссылку", "Справочник.Пользователи.ПустаяСсылка", "CatalogRef.Сотрудники", true],
    ["содержательную ссылку", "Справочник.Пользователи.Администратор", "CatalogRef.Пользователи", false],
  ] as const)("нормализует %s после DefinedType lookup", (_name, fillValue, sourceType, tagged) => {
    const attribute = normalizeDefinedTypeAttribute(fillValue, () => ({ status: "ok", type: { type: [sourceType] } }))
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения") === "xml/value").toBe(tagged)
  })

  it("не маркирует неразрешимый DefinedType автоматически", () => {
    const attribute = normalizeDefinedTypeAttribute(
      "Справочник.Пользователи.ПустаяСсылка",
      () => ({ status: "unresolved", reason: "не найден определяемый тип" }),
    )
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBeUndefined()
  })

  it.each([
    ["цель есть в компоненте", "found", false],
    ["цели нет в компоненте", "missing", true],
    ["цель неоднозначна", "ambiguous", false],
  ] as const)("нормализует DesignTimeRef, когда %s", (_name, status, tagged) => {
    const attribute = normalizeReferenceAttribute(status)
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBe(tagged ? "xml/reference" : undefined)
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

  it("маркирует несовместимое значение как XML-исключение", () => {
    const attribute: Record<string, unknown> = { Тип: "Строка(10)", ЗначениеЗаполнения: 1 }

    expect(normalizeMetadataAttribute(attribute)).toBe(0)
    expect(attribute.ЗначениеЗаполнения).toBe("!xml/value 1")
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBe("xml/value")
  })

  it.each([
    [
      "обычного реквизита",
      "MetadataAttribute",
      ["Реквизиты", "Получатель"],
      `Реквизиты:\n  Получатель:\n    Тип: Справочник.Контрагенты\n    ЗначениеЗаполнения: !xml/reference`,
    ],
    [
      "стандартного реквизита",
      "StandardAttributeDescription",
      ["СтандартныеРеквизиты", "Владелец"],
      `Владельцы: []\nСтандартныеРеквизиты:\n  Владелец:\n    ЗначениеЗаполнения: !xml/reference`,
    ],
  ] as const)("не дублирует тег уже перенесённой битой DesignTimeRef %s", (
    _name,
    itemType,
    itemYamlPath,
    yamlPrefix,
  ) => {
    const pair = "c794310a-bab9-4917-b1d0-e3438282256a.00000000-0000-0000-0000-000000000000"
    const yaml = importFromYAML(`${yamlPrefix} ${pair}\n`)
    const attribute = requiredRecordAt(yaml, itemYamlPath)
    const itemName = itemYamlPath.at(-1)
    if (itemName === undefined) throw new Error("Путь реквизита не должен быть пустым")

    normalizeImportedDependentItems({
      yaml,
      rule: MetadataCatalogRules,
      candidates: [candidate(
        itemType,
        itemYamlPath,
        itemName,
        { "_xsi:type": "xr:DesignTimeRef", "#text": pair },
      )],
      collector: createConfigurationIndexCollector(),
      owner: { dir: "Справочник", name: "Товары" },
    })

    const fillValue = attribute.ЗначениеЗаполнения
    expect(fillValue).toBe(`!xml/reference ${pair}`)
    if (typeof fillValue !== "string") throw new Error("Значение заполнения должно быть строкой")
    expect(xmlAnomalyTagPayload("xml/reference", fillValue)).toBe(pair)
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBe("xml/reference")
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
        "Предопределенный",
        { "_xsi:type": "xs:string", "#text": "false" },
      )],
      collector: createConfigurationIndexCollector(),
      owner: { dir: "Справочник", name: "Товары" },
    })).toBe(0)
    expect(attribute.ЗначениеЗаполнения).toBe("!xml/value Ложь")
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBe("xml/value")
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

  it("сохраняет начальную дату через !xml", () => {
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

    expect(removed).toBe(0)
    expect(attribute.ЗначениеЗаполнения).toBe("!xml/value 01.01.0001 00:00:00")
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBe("xml/value")
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

    expect(attribute.ЗначениеЗаполнения).toBe("!xml/value DesignTimeRef")
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBe("xml/value")
    expect(collector.fragment("Справочник/Товары/Свойства.yaml").entities).toEqual([])
  })

  it.each([
    [
      "типизированную пустую ссылку",
      "Справочник.ПапкиФайлов.ПустаяСсылка",
      { "_xsi:type": "xr:DesignTimeRef", "#text": "Catalog.ПапкиФайлов.EmptyRef" },
      "Справочник.ПапкиФайлов.ПустаяСсылка",
    ],
    ["пустой DesignTimeRef", ".", { "_xsi:type": "xr:DesignTimeRef" }, "DesignTimeRef"],
  ] as const)("маркирует %s владельца без владельцев и не создаёт snapshot", (_name, fillValue, xmlValue, expected) => {
    const attribute: Record<string, unknown> = { ЗначениеЗаполнения: fillValue }
    const collector = createConfigurationIndexCollector()
    const logicalAddress = "Справочник.Товары.StandardAttribute.Owner.Property.fillValue"

    expect(normalizeImportedDependentItems({
      yaml: { Владельцы: [], СтандартныеРеквизиты: { Владелец: attribute } },
      rule: MetadataCatalogRules,
      candidates: [{
        ...candidate("StandardAttributeDescription", ["СтандартныеРеквизиты", "Владелец"], "Владелец"),
        logicalAddress,
        xmlValue,
      }],
      collector,
      owner: { dir: "Справочник", name: "Товары" },
    })).toBe(0)

    expect(attribute.ЗначениеЗаполнения).toBe(`!xml/value ${expected}`)
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBe("xml/value")
    expect(collector.fragment("Справочник/Товары/Свойства.yaml").entities).not.toContainEqual(
      expect.objectContaining({ logicalAddress }),
    )
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

function requiredRecordAt(root: unknown, path: readonly string[]): Record<string, unknown> {
  let value = root
  for (const segment of path) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`По пути ${path.join(".")} ожидался объект`)
    }
    value = (value as Record<string, unknown>)[segment]
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`По пути ${path.join(".")} ожидался объект`)
  }
  return value as Record<string, unknown>
}
