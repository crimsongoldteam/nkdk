import { describe,expect,it } from "vitest"
import { mockContext } from "../../../../tests/mockContext"
import { compileValidationSchema } from "../../../validation/compileValidationSchema"
import { exportEventsToJSONSchema } from "./toJSONSchema"
import { eventsRule } from "./types"

const rule = eventsRule({
  yaml: "События",
  items: { onChange: "ПриИзменении" },
})

describe("схема JSON для событий", () => {
  it("принимает строковый обработчик или непустой объект режимов", () => {
    const schema = exportEventsToJSONSchema({ context: mockContext, rule, value: undefined })
    if (schema === undefined) throw new Error("Ожидалась схема событий")
    const Check = compileValidationSchema(schema).Check

    expect(Check({ ПриИзменении: "Обработчик" })).toBe(true)
    expect(Check({ ПриИзменении: { Перед: "Перед", После: "После" } })).toBe(true)
    expect(Check({ ПриИзменении: { Вместо: "Вместо" } })).toBe(true)
    expect(Check({ ПриИзменении: { Auto: "Обработчик" } })).toBe(false)
    expect(Check({ ПриИзменении: {} })).toBe(false)
    expect(Check({ ПриИзменении: { Перед: 1 } })).toBe(false)
  })
})
