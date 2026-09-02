import { describe, expect, it } from "vitest"
import { createValidationOwnerFacts, ownerFactFromYAML } from "./ownerFacts"

describe("ValidationOwnerFacts", () => {
  it("сохраняет дату через общий TypeDescription", () => {
    expect(ownerFactFromYAML("type", "Дата")).toEqual({
      type: ["dateTime"],
      dateQualifiers: { dateFractions: "Date" },
    })
  })

  it("сохраняет имена значений перечисления и вложенных предопределённых элементов", () => {
    expect(ownerFactFromYAML("enumValues", { Высокая: {}, Обычная: {} })).toEqual([
      { name: "Высокая" },
      { name: "Обычная" },
    ])
    expect(ownerFactFromYAML("predefined", {
      Группа: { Элементы: { Вложенное: {} } },
    })).toEqual([{ name: "Группа" }, { name: "Вложенное" }])
  })

  it("сохраняет значения модели как сведения владельца", () => {
    const facts = createValidationOwnerFacts({
      ref: { kind: "Перечисление", name: "Важность" },
      filePath: "/project/Перечисление/Важность/Свойства.yaml",
      fieldIndex: { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] },
      model: {
        itemType: "MetadataEnumeration",
        enumValues: [{ name: "Высокая" }, { name: "Обычная" }],
      },
    })

    expect(facts.enumValues).toEqual([{ name: "Высокая" }, { name: "Обычная" }])
  })

  it("сохраняет движения документа в типизированных фактах", () => {
    const facts = createValidationOwnerFacts({
      ref: { kind: "Документ", name: "Операция" },
      filePath: "/project/Документ/Операция/Свойства.yaml",
      fieldIndex: { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] },
      model: {
        itemType: "MetadataDocument",
        registerRecords: ["AccountingRegister.Хозрасчетный"],
      },
    })

    expect(facts).toMatchObject({
      registerRecords: ["AccountingRegister.Хозрасчетный"],
    })
  })

  it("сохраняет признаки учета плана счетов в типизированных фактах", () => {
    const facts = createValidationOwnerFacts({
      ref: { kind: "ПланСчетов", name: "Хозрасчетный" },
      filePath: "/project/ПланСчетов/Хозрасчетный/Свойства.yaml",
      fieldIndex: { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] },
      model: {
        itemType: "MetadataChartOfAccounts",
        extDimensionTypes: "ChartOfCharacteristicTypes.ВидыСубконто",
        accountingFlags: [{ name: "Валютный", type: { type: ["boolean"] } }],
        extDimensionAccountingFlags: [{ name: "Суммовой", type: { type: ["boolean"] } }],
      },
    })

    expect(facts).toMatchObject({
      extDimensionTypes: "ChartOfCharacteristicTypes.ВидыСубконто",
      accountingFlags: [{ name: "Валютный", type: { type: ["boolean"] } }],
      extDimensionAccountingFlags: [{ name: "Суммовой", type: { type: ["boolean"] } }],
    })
  })

  it("сохраняет план счетов регистра в типизированных фактах", () => {
    const facts = createValidationOwnerFacts({
      ref: { kind: "РегистрБухгалтерии", name: "Хозрасчетный" },
      filePath: "/project/РегистрБухгалтерии/Хозрасчетный/Свойства.yaml",
      fieldIndex: { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] },
      model: {
        itemType: "MetadataAccountingRegister",
        chartOfAccounts: "ChartOfAccounts.Хозрасчетный",
      },
    })

    expect(facts).toMatchObject({
      chartOfAccounts: "ChartOfAccounts.Хозрасчетный",
    })
  })

  it("сохраняет условия доступности виртуальных таблиц", () => {
    expect(ownerFactFromYAML("correspondence", "Истина")).toBe("true")
    expect(ownerFactFromYAML("actionPeriod", "Ложь")).toBe("false")

    const facts = createValidationOwnerFacts({
      ref: { kind: "РегистрРасчета", name: "Начисления" },
      filePath: "/project/РегистрРасчета/Начисления/Свойства.yaml",
      fieldIndex: { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] },
      model: {
        itemType: "MetadataCalculationRegister",
        actionPeriod: true,
        basePeriod: true,
        chartOfCalculationTypes: "ChartOfCalculationTypes.Начисления",
        schedule: "InformationRegister.График",
        scheduleDate: "InformationRegister.График.Dimension.Дата",
        scheduleValue: "InformationRegister.График.Resource.Значение",
      },
    })

    expect(facts).toMatchObject({
      actionPeriod: "true",
      basePeriod: "true",
      chartOfCalculationTypes: "ChartOfCalculationTypes.Начисления",
      schedule: "InformationRegister.График",
      scheduleDate: "InformationRegister.График.Dimension.Дата",
      scheduleValue: "InformationRegister.График.Resource.Значение",
    })
  })

  it("сохраняет владельцев справочника в типизированных фактах", () => {
    const facts = createValidationOwnerFacts({
      ref: { kind: "Справочник", name: "ПодарочныеСертификаты" },
      filePath: "/project/Справочник/ПодарочныеСертификаты/Свойства.yaml",
      fieldIndex: { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] },
      model: {
        itemType: "MetadataCatalog",
        owners: ["Catalog.ВидыПодарочныхСертификатов"],
      },
    })

    expect(facts).toMatchObject({
      owners: ["Catalog.ВидыПодарочныхСертификатов"],
    })
  })

  it("сохраняет задачу бизнес-процесса в типизированных фактах", () => {
    const facts = createValidationOwnerFacts({
      ref: { kind: "БизнесПроцесс", name: "Согласование" },
      filePath: "/project/БизнесПроцесс/Согласование/Свойства.yaml",
      fieldIndex: { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] },
      model: {
        itemType: "MetadataBusinessProcess",
        task: "Task.ЗадачаИсполнителя",
      },
    })

    expect(facts).toMatchObject({
      task: "Task.ЗадачаИсполнителя",
    })
  })
})
