import { describe, expect, it } from "vitest"
import { createDataPathRegistrySet } from "../validation/dataPath/registry"
import {
  getStandardMembers,
  type StandardMemberDeclaration,
} from "./declarations"

describe("standard member declarations", () => {
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

  it("stores declarations in an isolated DataPath registry", () => {
    const declaration = {
      memberKind: "standardAttribute",
      family: "primitive",
      kind: "string",
      names: { internal: "Code", yaml: "Код" },
      phase: "index-time",
      sourceScope: "ownerModel",
      fillValue: { policy: "byEffectiveType" },
    } as const satisfies StandardMemberDeclaration
    const dataPaths = createDataPathRegistrySet([
      { kind: "standardMembers", ownerKind: "Catalog", members: [declaration] },
    ])

    expect(dataPaths.getStandardMembers("Catalog")).toEqual([declaration])
  })
})
