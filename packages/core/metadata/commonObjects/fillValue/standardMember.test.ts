import { describe, expect, it } from "vitest"
import "../../appliedObjects/metadataCatalog/standardMembers"
import "../../appliedObjects/metadataTask/standardMembers"
import { getStandardMembers, type StandardMemberDeclaration } from "../../standardMembers/declarations"
import type { MetadataTypedValue } from "../metadataValue/types"
import { classifyStandardMemberFillValue } from "./effectiveType"

const catalogMember = (name: string): StandardMemberDeclaration => {
  const member = getStandardMembers("Справочник").find((item) => item.names.yaml === name)
  if (member === undefined) throw new Error(`Не найден стандартный реквизит ${name}`)
  return member
}

const classify = (
  member: StandardMemberDeclaration,
  value: MetadataTypedValue,
  ownerProperties: Readonly<Record<string, unknown>> = {}
) => classifyStandardMemberFillValue({ declaration: member, value, ownerProperties })

describe("standard member fill value", () => {
  it("checks task Date as DateTime", () => {
    const member = getStandardMembers("Задача").find(({ names }) => names.yaml === "Дата")
    if (member === undefined) throw new Error("Не найден стандартный реквизит Дата задачи")
    expect(classify(member, { type: "dateTime", value: "2026-08-09T12:30:00" }).kind).toBe("valid")
    expect(classify(member, { type: "dateTime", value: "0001-01-01T00:00:00" }).kind).toBe("implicit")
  })

  it.each(["Ссылка", "ЭтоГруппа", "Предопределенный", "ИмяПредопределенныхДанных"])(
    "forbids a fill value for %s",
    (name) => expect(classify(catalogMember(name), { type: "boolean", value: true }).kind).toBe("invalid")
  )

  it("allows only non-implicit deletion mark", () => {
    const member = catalogMember("ПометкаУдаления")
    expect(classify(member, { type: "boolean", value: true }).kind).toBe("valid")
    expect(classify(member, { type: "boolean", value: false }).kind).toBe("implicit")
  })

  it("checks catalog code using owner properties", () => {
    const member = catalogMember("Код")
    const stringOwner = { codeType: "String", codeLength: 3, codeAllowedLength: "Variable" }
    expect(classify(member, { type: "string", value: "12" }, stringOwner).kind).toBe("valid")
    expect(classify(member, { type: "string", value: "1234" }, stringOwner).kind).toBe("invalid")
    expect(classify(member, { type: "string", value: "   " }, stringOwner).kind).toBe("implicit")

    const numberOwner = { codeType: "Number", codeLength: 3, codeAllowedLength: "Variable" }
    expect(classify(member, { type: "decimal", value: 12 }, numberOwner).kind).toBe("valid")
    expect(classify(member, { type: "decimal", value: 0 }, numberOwner).kind).toBe("implicit")
    expect(classify(member, { type: "decimal", value: 1234 }, numberOwner).kind).toBe("invalid")
    expect(classify(member, { type: "decimal", value: 1.2 }, numberOwner).kind).toBe("invalid")
  })

  it("checks owner values against configured owners", () => {
    const member = catalogMember("Владелец")
    expect(
      classify(member, { type: "ref", value: "Catalog.Контрагенты.Поставщик" }, { owners: ["Catalog.Контрагенты"] })
        .kind
    ).toBe("valid")
    expect(
      classify(member, { type: "ref", value: "Catalog.Контрагенты.EmptyRef" }, { owners: ["Catalog.Контрагенты"] })
        .kind
    ).toBe("implicit")

    const compositeOwner = { owners: ["Catalog.Контрагенты", "Catalog.Партнеры"] }
    expect(classify(member, { type: "ref", value: "" }, compositeOwner).kind).toBe("valid")
    expect(classify(member, { type: "ref", value: "Catalog.Контрагенты.EmptyRef" }, compositeOwner).kind).toBe(
      "valid"
    )
  })

  it("does not diagnose an undeclared policy", () => {
    expect(classify(catalogMember("Наименование"), { type: "string", value: "" }).kind).toBe("notSpecified")
  })
})
