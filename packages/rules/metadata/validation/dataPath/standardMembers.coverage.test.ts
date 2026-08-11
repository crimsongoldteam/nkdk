import { describe, expect, it } from "vitest"
import { getStandardMembers } from "./standardMembers"

describe("standardMembers declarations coverage", () => {
  it.each([
    ["Справочник", ["Ref", "Owner", "Code", "Description", "Parent", "IsFolder", "DeletionMark", "Predefined", "PredefinedDataName"]],
    ["Документ", ["Ref", "Date", "Number", "Posted", "DeletionMark"]],
    ["Перечисление", ["Ref", "Order"]],
    ["ПланСчетов", ["Ref", "Code", "Description", "Parent", "Type", "OffBalance", "Order", "DeletionMark", "Predefined", "PredefinedDataName", "ExtDimensionTypes"]],
    ["ПланВидовХарактеристик", ["Ref", "ValueType", "Code", "Description", "Parent", "IsFolder", "DeletionMark", "Predefined", "PredefinedDataName"]],
    ["ПланВидовРасчета", ["Ref", "Code", "Description", "ActionPeriodIsBasic", "DeletionMark", "Predefined", "PredefinedDataName", "LeadingCalculationTypes", "DisplacingCalculationTypes", "BaseCalculationTypes"]],
    ["ПланОбмена", ["Ref", "Code", "Description", "ThisNode", "ExchangeDate", "SentNo", "ReceivedNo", "DeletionMark"]],
    ["ЖурналДокументов", ["Ref", "Type", "Date", "Number", "Posted", "DeletionMark"]],
    ["БизнесПроцесс", ["Ref", "Date", "Number", "Started", "Completed", "HeadTask", "DeletionMark"]],
    ["Задача", ["Ref", "Date", "Number", "Executed", "BusinessProcess", "RoutePoint", "Description", "DeletionMark"]],
    ["РегистрСведений", ["Active", "LineNumber", "Recorder", "Period"]],
    ["РегистрНакопления", ["RecordType", "Active", "LineNumber", "Recorder", "Period"]],
    ["РегистрБухгалтерии", ["PeriodAdjustment", "Account", "Active", "LineNumber", "Recorder", "Period", "ExtDimension1", "ExtDimensionType1"]],
    ["РегистрРасчета", ["RegistrationPeriod", "ReversingEntry", "Active", "BegOfActionPeriod", "EndOfActionPeriod", "ActionPeriod", "BegOfBasePeriod", "EndOfBasePeriod", "CalculationType", "LineNumber", "Recorder"]],
  ])("%s has declared standard members", (ownerKind, expectedNames) => {
    const actualNames = getStandardMembers(ownerKind).map((member) => member.names.internal)
    for (const name of expectedNames) expect(actualNames).toContain(name)
  })
})
