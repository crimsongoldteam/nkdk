import { afterEach, describe, expect, it } from "vitest"
import { metadataAccountingRegisterStandardMemberRules } from "../appliedObjects/metadataAccountingRegister/standardMembers"
import { metadataAccumulationRegisterStandardMemberRules } from "../appliedObjects/metadataAccumulationRegister/standardMembers"
import { metadataBusinessProcessStandardMemberRules } from "../appliedObjects/metadataBusinessProcess/standardMembers"
import { metadataCalculationRegisterStandardMemberRules } from "../appliedObjects/metadataCalculationRegister/standardMembers"
import { metadataDocumentStandardMemberRules } from "../appliedObjects/metadataDocument/standardMembers"
import { metadataDocumentJournalStandardMemberRules } from "../appliedObjects/metadataDocumentJournal/standardMembers"
import { metadataExchangePlanStandardMemberRules } from "../appliedObjects/metadataExchangePlan/standardMembers"
import { metadataInformationRegisterStandardMemberRules } from "../appliedObjects/metadataInformationRegister/standardMembers"
import { metadataTaskStandardMemberRules } from "../appliedObjects/metadataTask/standardMembers"
import { applyLegacyDataPathContributions } from "../validation/dataPath/registry"
import {
  clearStandardMembersForTests,
  getStandardMembers,
  registerStandardMembers,
  restoreStandardMembersForTests,
  snapshotStandardMembersForTests,
  type StandardMemberDeclaration,
} from "./declarations"

applyLegacyDataPathContributions([
  ...metadataAccountingRegisterStandardMemberRules,
  ...metadataAccumulationRegisterStandardMemberRules,
  ...metadataBusinessProcessStandardMemberRules,
  ...metadataCalculationRegisterStandardMemberRules,
  ...metadataDocumentStandardMemberRules,
  ...metadataDocumentJournalStandardMemberRules,
  ...metadataExchangePlanStandardMemberRules,
  ...metadataInformationRegisterStandardMemberRules,
  ...metadataTaskStandardMemberRules,
])

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
