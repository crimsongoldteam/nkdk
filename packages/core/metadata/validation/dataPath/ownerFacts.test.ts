import { describe, expect, it } from "vitest"
import { createValidationOwnerFacts } from "./ownerFacts"

describe("ValidationOwnerFacts", () => {
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
