import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { UserVisibleJSONSchema } from "./types"

describe("UserVisibleJSONSchema", () => {
  const compiled = TypeCompiler.Compile(UserVisibleJSONSchema)

  it("accepts allow mode without explicit Разрешить", () => {
    expect(compiled.Check({ Роли: { "Role.Администратор": "Ложь" } })).toBe(true)
  })

  it("accepts deny mode with Разрешить Ложь", () => {
    expect(compiled.Check({ Разрешить: "Ложь", Роли: { "Role.Администратор": "Истина" } })).toBe(true)
  })

  it("accepts empty deny mode without roles", () => {
    expect(compiled.Check({ Разрешить: "Ложь" })).toBe(true)
  })

  it("rejects explicit Разрешить Истина", () => {
    expect(compiled.Check({ Разрешить: "Истина", Роли: { "Role.Администратор": "Истина" } })).toBe(false)
  })

  it("rejects empty roles", () => {
    expect(compiled.Check({ Роли: {} })).toBe(false)
  })

  it("rejects legacy role map at top level", () => {
    expect(compiled.Check({ "Role.Администратор": "Истина" })).toBe(false)
  })
})
