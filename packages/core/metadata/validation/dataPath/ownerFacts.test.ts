import { describe, expect, it } from "vitest"
import { createValidationOwnerFacts, modelStubFromOwnerFacts } from "./ownerFacts"

describe("ValidationOwnerFacts", () => {
  it("keeps document register records in model stubs", () => {
    const facts = createValidationOwnerFacts({
      ref: { kind: "Документ", name: "Операция" },
      filePath: "/project/Документ/Операция/Свойства.yaml",
      fieldIndex: { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] },
      model: {
        itemType: "MetadataDocument",
        registerRecords: ["AccountingRegister.Хозрасчетный"],
      },
    })

    expect(modelStubFromOwnerFacts(facts)).toMatchObject({
      registerRecords: ["AccountingRegister.Хозрасчетный"],
    })
  })

  it("keeps chart of accounts accounting flags in model stubs", () => {
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

    expect(modelStubFromOwnerFacts(facts)).toMatchObject({
      extDimensionTypes: "ChartOfCharacteristicTypes.ВидыСубконто",
      accountingFlags: [{ name: "Валютный", type: { type: ["boolean"] } }],
      extDimensionAccountingFlags: [{ name: "Суммовой", type: { type: ["boolean"] } }],
    })
  })

  it("keeps accounting register chart of accounts in model stubs", () => {
    const facts = createValidationOwnerFacts({
      ref: { kind: "РегистрБухгалтерии", name: "Хозрасчетный" },
      filePath: "/project/РегистрБухгалтерии/Хозрасчетный/Свойства.yaml",
      fieldIndex: { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] },
      model: {
        itemType: "MetadataAccountingRegister",
        chartOfAccounts: "ChartOfAccounts.Хозрасчетный",
      },
    })

    expect(modelStubFromOwnerFacts(facts)).toMatchObject({
      chartOfAccounts: "ChartOfAccounts.Хозрасчетный",
    })
  })

  it("keeps catalog owners in model stubs", () => {
    const facts = createValidationOwnerFacts({
      ref: { kind: "Справочник", name: "ПодарочныеСертификаты" },
      filePath: "/project/Справочник/ПодарочныеСертификаты/Свойства.yaml",
      fieldIndex: { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] },
      model: {
        itemType: "MetadataCatalog",
        owners: ["Catalog.ВидыПодарочныхСертификатов"],
      },
    })

    expect(modelStubFromOwnerFacts(facts)).toMatchObject({
      owners: ["Catalog.ВидыПодарочныхСертификатов"],
    })
  })

  it("keeps business process task links in model stubs", () => {
    const facts = createValidationOwnerFacts({
      ref: { kind: "БизнесПроцесс", name: "Согласование" },
      filePath: "/project/БизнесПроцесс/Согласование/Свойства.yaml",
      fieldIndex: { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] },
      model: {
        itemType: "MetadataBusinessProcess",
        task: "Task.ЗадачаИсполнителя",
      },
    })

    expect(modelStubFromOwnerFacts(facts)).toMatchObject({
      task: "Task.ЗадачаИсполнителя",
    })
  })
})
