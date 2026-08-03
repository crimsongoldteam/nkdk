import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  testMetadataItemFromXMLToYAML,
  testMetadataItemFromYAMLToXML,
} from "../../../../tests/directConversion"
import { importContentFromXML } from "../../../../xml/import/importer"
import { xmlExport } from "../../../../xml/export/exporter"
import { withConfigurationIndexFormElementRootLogicalAddress } from "../../../configurationIndex/collector/context"
import type { CollectableElementType } from "../../../orchestration/formElement/types"
import { getElementRule } from "../orchestration/ruleFactory"
import { withKnownXMLDefaults } from "../../../../tests/knownXMLDefaults"
import { TableRules } from "../table/rules"
import { CheckBoxFieldRules, TableCheckBoxFieldRules } from "../checkBoxField/rules"
import { UsualGroupRules } from "../usualGroup/rules"
import { createFormDataPathIndexFromYAML } from "../../../validation/dataPath/formYamlIndex"
import { ButtonRules } from "../button/rules"
import { InputFieldRules, TableInputFieldRules } from "../inputField/rules"
import { RadioButtonFieldRules } from "../radioButtonField/rules"
import { ExtendedTooltipRules } from "../extendedTooltip/rules"
import { TableLabelFieldRules } from "../labelField/rules"
import { TablePictureFieldRules } from "../pictureField/rules"
import { GraphicalSchemaFieldRules } from "../graphicalSchemaField/rules"
import { exportToYAML } from "../../../../yaml/export"

import "../index"

const elementsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const fixtures = fs
  .readdirSync(elementsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((entry) => {
    const fixtureDir = path.join(elementsDir, entry.name, "__fixtures__")
    if (!fs.existsSync(fixtureDir)) return []
    return fs
      .readdirSync(fixtureDir)
      .filter((name) => name.endsWith(".xml"))
      .map((name) => path.join(fixtureDir, name))
  })

describe("элементы формы XML → YAML → XML", () => {
  it.each(fixtures)("%s", (fixture) => {
    const parsed = importContentFromXML<Record<string, Record<string, unknown>>>(fs.readFileSync(fixture, "utf8"), {
      preserveXsiNil: true,
    })
    const [xmlTag, xml] = Object.entries(parsed)[0] ?? []
    if (xmlTag === undefined || xml === undefined) throw new Error(`Пустая XML-фикстура: ${fixture}`)

    const itemType = resolveItemType(xmlTag, path.basename(fixture), xml)
    const rule = getElementRule(itemType)
    const name = typeof xml._name === "string" ? xml._name : undefined
    const formLogicalAddress = "Справочник.Товары.Форма.ФормаЭлемента"
    const contexts = createDirectRoundTripContexts({
      logicalAddress: `${formLogicalAddress}.Элемент.${name ?? xmlTag}`,
    })
    const yaml = testMetadataItemFromXMLToYAML({
      rule,
      xml,
      name,
      context: withConfigurationIndexFormElementRootLogicalAddress(contexts.importContext, formLogicalAddress),
    }).yaml
    const directExportContext = contexts.exportContext()
    const exportContext = isDynamicListTableFixture(fixture)
      ? {
          ...directExportContext,
          importFromYAML: {
            ...directExportContext.importFromYAML,
            formDataPathIndex: createFormDataPathIndexFromYAML({
              Реквизиты: { ДинамическийСписок: { Тип: "ДинамическийСписок" } },
            }),
          },
        }
      : directExportContext
    const configurationIndex = exportContext.exportToXML.configurationIndex
    if (configurationIndex === undefined) throw new Error("Не создан runtime индекса конфигурации")
    const result = testMetadataItemFromYAMLToXML({
      rule,
      yaml,
      name,
      referenceXML: xml,
      context: {
        ...exportContext,
        exportToXML: {
          ...exportContext.exportToXML,
          configurationIndex: configurationIndex.withFormElementRootLogicalAddress(formLogicalAddress),
        },
      },
    }).xml

    if (typeof xml.DataPath === "string" && rule.properties.dataPath?.yaml !== undefined) {
      expect(yaml).toMatchObject({ [rule.properties.dataPath.yaml]: xml.DataPath })
      const withoutReference = testMetadataItemFromYAMLToXML({
        rule,
        yaml,
        name,
        context: {
          ...exportContext,
          exportToXML: {
            ...exportContext.exportToXML,
            configurationIndex: configurationIndex.withFormElementRootLogicalAddress(formLogicalAddress),
          },
        },
      }).xml
      expect(withoutReference.DataPath).toBe(xml.DataPath)
    }

    const actualXML = withoutDeclaration(xmlExport({ [xmlTag]: result }, false))
    const expectedXML = withKnownXMLDefaults(fs.readFileSync(fixture, "utf8").trim(), {
      includeCheckBoxType: false,
    })
    if (expectedXML.includes("<Table")) {
      expect(withoutComputedTableServiceNodes(importContentFromXML(actualXML, { preserveXsiNil: true }))).toEqual(
        withoutComputedTableServiceNodes(importContentFromXML(expectedXML, { preserveXsiNil: true }))
      )
    } else {
      expect(actualXML).toBe(expectedXML)
    }
  })

  it.each([
    ["AutoInsertNewRow", "АвтоВводНовойСтроки"],
    ["EnableStartDrag", "РазрешитьНачалоПеретаскивания"],
    ["EnableDrag", "РазрешитьПеретаскивание"],
  ])("сохраняет XML-семантику %s без reference", (xmlKey, yamlKey) => {
    const explicit = testMetadataItemFromXMLToYAML({
      rule: TableRules,
      xml: { _name: "Таблица", [xmlKey]: true },
      name: "Таблица",
    }).yaml as Record<string, unknown>
    expect(explicit).not.toHaveProperty(yamlKey)
    expect(testMetadataItemFromYAMLToXML({ rule: TableRules, yaml: explicit, name: "Таблица" }).xml).toHaveProperty(
      xmlKey,
      true
    )

    const implicit = testMetadataItemFromXMLToYAML({
      rule: TableRules,
      xml: { _name: "Табица" },
      name: "Таблица",
    }).yaml as Record<string, unknown>
    expect(implicit).toHaveProperty(yamlKey, "Ложь")
    expect(testMetadataItemFromYAMLToXML({ rule: TableRules, yaml: implicit, name: "Таблица" }).xml).not.toHaveProperty(
      xmlKey
    )
  })

  it("сохраняет обязательный Button.Type в YAML", () => {
    const yaml = testMetadataItemFromXMLToYAML({
      rule: ButtonRules,
      xml: { _name: "Кнопка", Type: "UsualButton" },
      name: "Кнопка",
    }).yaml

    expect(yaml).toHaveProperty("Вид", "ОбычнаяКнопка")
  })

  it("различает XML- и YAML-default EnableContentChange", () => {
    const explicit = testMetadataItemFromXMLToYAML({
      rule: UsualGroupRules,
      xml: { _name: "Группа", EnableContentChange: true },
      name: "Группа",
    }).yaml
    expect(explicit).not.toHaveProperty("РазрешитьИзменениеСостава")
    expect(testMetadataItemFromYAMLToXML({ rule: UsualGroupRules, yaml: explicit, name: "Группа" }).xml).toHaveProperty(
      "EnableContentChange",
      true
    )

    const absent = testMetadataItemFromXMLToYAML({
      rule: UsualGroupRules,
      xml: { _name: "Группа" },
      name: "Группа",
    }).yaml
    expect(absent).toHaveProperty("РазрешитьИзменениеСостава", "Ложь")
    expect(testMetadataItemFromYAMLToXML({ rule: UsualGroupRules, yaml: absent, name: "Группа" }).xml).not.toHaveProperty(
      "EnableContentChange"
    )
  })

  it("не записывает отсутствующий AutoCellHeight в YAML и XML", () => {
    const absent = testMetadataItemFromXMLToYAML({
      rule: InputFieldRules,
      xml: { _name: "Поле" },
      name: "Поле",
    }).yaml
    expect(absent).not.toHaveProperty("АвтоВысотаЯчейки")
    expect(testMetadataItemFromYAMLToXML({ rule: InputFieldRules, yaml: absent, name: "Поле" }).xml).not.toHaveProperty(
      "AutoCellHeight"
    )

    const explicit = testMetadataItemFromXMLToYAML({
      rule: InputFieldRules,
      xml: { _name: "Поле", AutoCellHeight: true },
      name: "Поле",
    }).yaml
    expect(explicit).toHaveProperty("АвтоВысотаЯчейки", "Истина")
    expect(testMetadataItemFromYAMLToXML({ rule: InputFieldRules, yaml: explicit, name: "Поле" }).xml).toHaveProperty(
      "AutoCellHeight",
      true
    )
  })

  it("восстанавливает обязательный RadioButtonType=Auto без reference", () => {
    const yaml = testMetadataItemFromXMLToYAML({
      rule: RadioButtonFieldRules,
      xml: { _name: "Переключатель", RadioButtonType: "Auto" },
      name: "Переключатель",
    }).yaml
    expect(yaml).not.toHaveProperty("ВидПереключателя")
    expect(
      testMetadataItemFromYAMLToXML({ rule: RadioButtonFieldRules, yaml, name: "Переключатель" }).xml
    ).toHaveProperty("RadioButtonType", "Auto")
  })

  it.each([
    ["явный List", { _name: "Таблица", Representation: "List", DataPath: "Дерево" }, "Список", "List"],
    ["явный Tree", { _name: "Таблица", Representation: "Tree", DataPath: "Таблица" }, "Дерево", "Tree"],
  ])("сохраняет Representation: %s", (_case, xml, yamlValue, xmlValue) => {
    const yaml = testMetadataItemFromXMLToYAML({ rule: TableRules, xml, name: "Таблица" }).yaml
    expect(yaml).toHaveProperty("Отображение", yamlValue)
    expect(testMetadataItemFromYAMLToXML({ rule: TableRules, yaml, name: "Таблица" }).xml).toHaveProperty(
      "Representation",
      xmlValue
    )
  })

  it("не создаёт Representation, если его нет в XML", () => {
    const yaml = testMetadataItemFromXMLToYAML({
      rule: TableRules,
      xml: { _name: "Таблица" },
      name: "Таблица",
    }).yaml
    expect(yaml).not.toHaveProperty("Отображение")
    expect(testMetadataItemFromYAMLToXML({ rule: TableRules, yaml, name: "Таблица" }).xml).not.toHaveProperty(
      "Representation"
    )
  })

  it.each([
    ["HorizontalStretch", "РастягиватьПоГоризонтали"],
    ["VerticalStretch", "РастягиватьПоВертикали"],
  ])("сохраняет трёхзначное растяжение группы %s", (xmlKey, yamlKey) => {
    const cases = [
      [{ _name: "Группа" }, undefined, undefined],
      [{ _name: "Группа", [xmlKey]: "auto" }, undefined, undefined],
      [{ _name: "Группа", [xmlKey]: false }, "Ложь", false],
      [{ _name: "Группа", [xmlKey]: true }, "Истина", true],
    ] as const

    for (const [xml, yamlValue, expectedXML] of cases) {
      const yaml = testMetadataItemFromXMLToYAML({ rule: UsualGroupRules, xml, name: "Группа" }).yaml as Record<
        string,
        unknown
      >
      if (yamlValue === undefined) expect(yaml).not.toHaveProperty(yamlKey)
      else expect(yaml).toHaveProperty(yamlKey, yamlValue)

      const restored = testMetadataItemFromYAMLToXML({ rule: UsualGroupRules, yaml, name: "Группа" }).xml
      if (expectedXML === undefined) expect(restored).not.toHaveProperty(xmlKey)
      else expect(restored).toHaveProperty(xmlKey, expectedXML)
    }
  })

  it.each([CheckBoxFieldRules, TableCheckBoxFieldRules])(
    "$itemType восстанавливает CheckBoxType по ThreeState",
    (rule) => {
      expect(testMetadataItemFromYAMLToXML({ rule, yaml: {}, name: "Флажок" }).xml).toHaveProperty(
        "CheckBoxType",
        "Auto"
      )

      const threeState = testMetadataItemFromYAMLToXML({
        rule,
        yaml: { ТриСостояния: "Истина" },
        name: "Флажок",
      }).xml
      expect(threeState).toHaveProperty("ThreeState", true)
      expect(threeState).not.toHaveProperty("CheckBoxType")

      expect(
        testMetadataItemFromYAMLToXML({
          rule,
          yaml: { ВидФлажка: "Выключатель" },
          name: "Флажок",
        }).xml
      ).toHaveProperty("CheckBoxType", "Switch")

      expect(
        testMetadataItemFromYAMLToXML({
          rule,
          yaml: { ТриСостояния: "Истина", ВидФлажка: "Выключатель" },
          name: "Флажок",
        }).xml
      ).toMatchObject({ ThreeState: true, CheckBoxType: "Switch" })
    }
  )

  it.each([CheckBoxFieldRules, TableCheckBoxFieldRules])(
    "$itemType сохраняет три состояния EqualItemsWidth",
    (rule) => {
      const cases = [
        [{ _name: "Флажок" }, undefined, undefined],
        [{ _name: "Флажок", EqualItemsWidth: true }, "Истина", true],
        [{ _name: "Флажок", EqualItemsWidth: false }, "Ложь", false],
      ] as const

      for (const [xml, yamlValue, restoredValue] of cases) {
        const yaml = testMetadataItemFromXMLToYAML({ rule, xml, name: "Флажок" }).yaml
        if (yamlValue === undefined) expect(yaml).not.toHaveProperty("ОдинаковаяШиринаЭлементов")
        else expect(yaml).toHaveProperty("ОдинаковаяШиринаЭлементов", yamlValue)

        const restored = testMetadataItemFromYAMLToXML({ rule, yaml, name: "Флажок" }).xml
        if (restoredValue === undefined) expect(restored).not.toHaveProperty("EqualItemsWidth")
        else expect(restored).toHaveProperty("EqualItemsWidth", restoredValue)
      }
    }
  )

  it("сохраняет явный GraphicalSchemaField.Edit=false", () => {
    const absent = testMetadataItemFromXMLToYAML({
      rule: GraphicalSchemaFieldRules,
      xml: { _name: "Схема" },
      name: "Схема",
    }).yaml
    expect(absent).not.toHaveProperty("Редактирование")
    expect(
      testMetadataItemFromYAMLToXML({ rule: GraphicalSchemaFieldRules, yaml: absent, name: "Схема" }).xml
    ).not.toHaveProperty("Edit")

    const explicitFalse = testMetadataItemFromXMLToYAML({
      rule: GraphicalSchemaFieldRules,
      xml: { _name: "Схема", Edit: false },
      name: "Схема",
    }).yaml
    expect(explicitFalse).toHaveProperty("Редактирование", "Ложь")
    expect(
      testMetadataItemFromYAMLToXML({
        rule: GraphicalSchemaFieldRules,
        yaml: explicitFalse,
        name: "Схема",
      }).xml
    ).toHaveProperty("Edit", false)

    const explicitTrue = testMetadataItemFromXMLToYAML({
      rule: GraphicalSchemaFieldRules,
      xml: { _name: "Схема", Edit: true },
      name: "Схема",
    }).yaml
    expect(explicitTrue).not.toHaveProperty("Редактирование")
  })

  it("сохраняет пустой форматированный заголовок ExtendedTooltip без reference", () => {
    const yaml = testMetadataItemFromXMLToYAML({
      rule: ExtendedTooltipRules,
      xml: { _name: "ПолеРасширеннаяПодсказка", Title: { _formatted: true } },
      name: "ПолеРасширеннаяПодсказка",
    }).yaml

    expect(yaml).toMatchObject({
      Заголовок: { Форматированный: "Истина", Текст: "" },
    })
    expect(
      testMetadataItemFromYAMLToXML({
        rule: ExtendedTooltipRules,
        yaml,
        name: "ПолеРасширеннаяПодсказка",
      }).xml
    ).toHaveProperty("Title", { _formatted: true })
  })

  it("не создаёт отсутствующий заголовок ExtendedTooltip", () => {
    expect(
      testMetadataItemFromYAMLToXML({
        rule: ExtendedTooltipRules,
        yaml: {},
        name: "ПолеРасширеннаяПодсказка",
      }).xml
    ).not.toHaveProperty("Title")
  })

  it.each([TableInputFieldRules, TableLabelFieldRules, TablePictureFieldRules, TableCheckBoxFieldRules])(
    "preserves explicit table HeaderHorizontalAlign=Auto through !xml",
    (rule) => {
      const yaml = testMetadataItemFromXMLToYAML({
        rule,
        xml: { _name: "Колонка", DataPath: "Таблица.Поле", HeaderHorizontalAlign: "Auto" },
        name: "Колонка",
      }).yaml
      expect(exportToYAML(yaml)).toContain("ГоризонтальноеПоложениеВШапке: !xml Авто")
      expect(testMetadataItemFromYAMLToXML({ rule, yaml, name: "Колонка" }).xml).toHaveProperty(
        "HeaderHorizontalAlign",
        "Auto"
      )
    }
  )
})

function withoutComputedTableServiceNodes<T>(value: T): T {
  if (Array.isArray(value)) return value.map(withoutComputedTableServiceNodes) as T
  if (typeof value !== "object" || value === null) return value

  const source = value as Record<string, unknown>
  const result = Object.fromEntries(
    Object.entries(source)
      .filter(([key]) => key !== "Period" && key !== "TopLevelParent" && key !== "RowFilter")
      .map(([key, nested]) => [
        key,
        key === "#text" && typeof nested === "string" && nested.trim().length === 0
          ? ""
          : withoutComputedTableServiceNodes(nested),
      ])
  )
  return result as T
}

function resolveItemType(xmlTag: string, fixtureName: string, xml: Record<string, unknown>): CollectableElementType {
  if (
    fixtureName.includes("Table") &&
    (xmlTag === "CheckBoxField" || xmlTag === "InputField" || xmlTag === "LabelField" || xmlTag === "PictureField")
  ) {
    return `Table${xmlTag}` as CollectableElementType
  }
  if (
    xmlTag === "Button" &&
    (xml.Type === "CommandBarButton" || xml.Type === "CommandBarHyperlink" || fixtureName.includes("commandBar"))
  ) {
    return "CommandBarButton"
  }
  return xmlTag as CollectableElementType
}

function withoutDeclaration(xml: string): string {
  return xml.replace(/^\uFEFF?<\?xml[^>]+>\s*/, "").trim()
}

function isDynamicListTableFixture(fixture: string): boolean {
  return path.basename(fixture) === "dynamicList.xml" && path.basename(path.dirname(path.dirname(fixture))) === "table"
}
