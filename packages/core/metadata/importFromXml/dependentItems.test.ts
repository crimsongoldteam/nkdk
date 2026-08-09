import { describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"
import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import { registerCoreMetadata } from "../register"
import type { ImportedDependentPropertyCandidate } from "../orchestration/property/importYamlTypes"
import { normalizeImportedDependentItems } from "./dependentItems"

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

  it.each([
    ["непустое допустимое", "А"],
    ["несовместимое", 1],
  ])("сохраняет %s значение для последующей локальной валидации", (_name, fillValue) => {
    const attribute = { Тип: "Строка(10)", ЗначениеЗаполнения: fillValue }
    const yaml = { Реквизиты: { Получатель: attribute } }

    expect(normalizeImportedDependentItems({
      yaml,
      rule: MetadataCatalogRules,
      candidates: [candidate("MetadataAttribute", ["Реквизиты", "Получатель"], "Получатель")],
      collector: createConfigurationIndexCollector(),
      owner: { dir: "Справочник", name: "Товары" },
    })).toBe(0)
    expect(attribute).toHaveProperty("ЗначениеЗаполнения", fillValue)
  })

  it("сохраняет точный пробельный XML стандартного кода в снимке", () => {
    const yaml = {
      ТипКода: "Строка",
      ДлинаКода: 3,
      ДопустимаяДлинаКода: "Переменная",
      СтандартныеРеквизиты: { Код: { ЗначениеЗаполнения: "   " } },
    }
    const collector = createConfigurationIndexCollector()

    normalizeImportedDependentItems({
      yaml,
      rule: MetadataCatalogRules,
      candidates: [{
        ...candidate("StandardAttributeDescription", ["СтандартныеРеквизиты", "Код"], "Код"),
        logicalAddress: "Справочник.Товары.StandardAttribute.Code.Property.fillValue",
        xmlValue: { "_xsi:type": "xs:string", "#text": "   " },
      }],
      collector,
      owner: { dir: "Справочник", name: "Товары" },
    })

    expect(yaml.СтандартныеРеквизиты.Код).not.toHaveProperty("ЗначениеЗаполнения")
    expect(collector.fragment("Справочник/Товары/Свойства.yaml").entities).toContainEqual({
      logicalAddress: "Справочник.Товары.StandardAttribute.Code.Property.fillValue",
      sourceProjectPath: "Справочник/Товары/Свойства.yaml",
      xml: { xsiType: "xs:string", xmlText: "   " },
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
    [
      "пустой DesignTimeRef",
      "Справочник.Контрагенты",
      ".",
      { "_xsi:type": "xr:DesignTimeRef" },
      { xsiType: "xr:DesignTimeRef" },
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
