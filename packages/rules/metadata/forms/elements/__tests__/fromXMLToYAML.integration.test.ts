import { describe,expect,it } from "vitest"

import { testMetadataItemFromXMLToYAML,testMetadataItemFromYAMLToXML } from "../../../../tests/directConversion"
import { ButtonRules } from "../button/rules"
import { CheckBoxFieldRules,TableCheckBoxFieldRules } from "../checkBoxField/rules"
import { ExtendedTooltipRules } from "../extendedTooltip/rules"
import { GraphicalSchemaFieldRules } from "../graphicalSchemaField/rules"
import { InputFieldRules } from "../inputField/rules"
import { RadioButtonFieldRules } from "../radioButtonField/rules"
import { TableRules } from "../table/rules"
import { UsualGroupRules } from "../usualGroup/rules"

import "../index"

describe("элементы формы XML → YAML → XML", () => {
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

  it("выводит TextEdit раньше ChoiceForm у обычного InputField", () => {
    const { xml } = testMetadataItemFromYAMLToXML({
      rule: InputFieldRules,
      name: "Поле",
      yaml: {
        РедактированиеТекста: "Ложь",
        ФормаВыбора: "Справочник.Товары.Форма.ФормаВыбора",
      },
    })

    expect(Object.keys(xml).filter((key) => key === "TextEdit" || key === "ChoiceForm")).toEqual([
      "TextEdit",
      "ChoiceForm",
    ])
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
      ).toHaveProperty("CheckBoxType", "Switcher")

      expect(
        testMetadataItemFromYAMLToXML({
          rule,
          yaml: { ТриСостояния: "Истина", ВидФлажка: "Выключатель" },
          name: "Флажок",
        }).xml
      ).toMatchObject({ ThreeState: true, CheckBoxType: "Switcher" })
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

  it("не создаёт отсутствующий заголовок ExtendedTooltip", () => {
    expect(
      testMetadataItemFromYAMLToXML({
        rule: ExtendedTooltipRules,
        yaml: {},
        name: "ПолеРасширеннаяПодсказка",
      }).xml
    ).not.toHaveProperty("Title")
  })
})
