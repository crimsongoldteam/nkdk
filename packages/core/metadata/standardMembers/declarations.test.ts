import { afterEach, describe, expect, it } from "vitest"
import "../appliedObjects/metadataAccountingRegister/standardMembers"
import "../appliedObjects/metadataAccumulationRegister/standardMembers"
import "../appliedObjects/metadataBusinessProcess/standardMembers"
import "../appliedObjects/metadataCalculationRegister/standardMembers"
import "../appliedObjects/metadataDocument/standardMembers"
import "../appliedObjects/metadataDocumentJournal/standardMembers"
import "../appliedObjects/metadataExchangePlan/standardMembers"
import "../appliedObjects/metadataInformationRegister/standardMembers"
import "../appliedObjects/metadataTask/standardMembers"
import {
  clearStandardMembersForTests,
  getStandardMembers,
  registerStandardMembers,
  restoreStandardMembersForTests,
  snapshotStandardMembersForTests,
  type StandardMemberDeclaration,
} from "./declarations"

describe("standard member declarations", () => {
  const initial = snapshotStandardMembersForTests()

  afterEach(() => restoreStandardMembersForTests(initial))

  it.each([
    ["Документ", "Дата"],
    ["БизнесПроцесс", "Дата"],
    ["Задача", "Дата"],
    ["ЖурналДокументов", "Дата"],
    ["ПланОбмена", "ДатаОбмена"],
    ["РегистрСведений", "Период"],
    ["РегистрНакопления", "Период"],
    ["РегистрБухгалтерии", "Период"],
    ["РегистрРасчета", "ПериодРегистрации"],
    ["РегистрРасчета", "НачалоПериодаДействия"],
    ["РегистрРасчета", "КонецПериодаДействия"],
    ["РегистрРасчета", "ПериодДействия"],
    ["РегистрРасчета", "НачалоБазовогоПериода"],
    ["РегистрРасчета", "КонецБазовогоПериода"],
  ] as const)("declares fill-value policy for %s.%s", (owner, name) => {
    const member = getStandardMembers(owner).find(({ names }) => names.yaml === name)
    expect(member?.fillValue).toEqual({ policy: "byEffectiveType" })
  })

  it("stores declarations independently from DataPath", () => {
    clearStandardMembersForTests()
    const declaration = {
      memberKind: "standardAttribute",
      family: "primitive",
      kind: "string",
      names: { internal: "Code", yaml: "Код" },
      phase: "index-time",
      sourceScope: "ownerModel",
      fillValue: { policy: "byEffectiveType" },
    } as const satisfies StandardMemberDeclaration

    registerStandardMembers("Catalog", [declaration])

    expect(getStandardMembers("Catalog")).toEqual([declaration])
  })
})
