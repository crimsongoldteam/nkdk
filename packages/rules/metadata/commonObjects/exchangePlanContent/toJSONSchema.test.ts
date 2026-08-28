import { beforeAll, describe, expect, it } from "vitest"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { mockContext } from "../../../tests/mockContext"
import { withDirectMetadataExecution } from "../../../tests/directConversion"

import { exchangePlanContentItemsToJSONSchema } from "./toJSONSchema"

describe("JSON Schema состава плана обмена", () => {
  let schema: ReturnType<typeof compileValidationSchema>
  beforeAll(() => {
    schema = withDirectMetadataExecution(() =>
      compileValidationSchema(exchangePlanContentItemsToJSONSchema({ context: mockContext })))
  })

  it.each([
    { value: [{ Метаданные: "Документ.Заказ" }] },
    { value: [{ Метаданные: "Документ.Заказ", Авторегистрация: "Разрешить" }] },
    { value: [{ Метаданные: "Документ.Заказ", Использовать: "Ложь" }] },
  ])("принимает допустимую форму $value", ({ value }) => {
    expect(schema.Check(value)).toBe(true)
  })

  it.each([
    { value: [{ Метаданные: "Документ.Заказ", Использовать: "Истина" }] },
    { value: [{ Метаданные: "Документ.Заказ", Использовать: "Ложь", Авторегистрация: "Разрешить" }] },
    { value: [{ Метаданные: "Документ.Заказ", Лишнее: true }] },
  ])("отклоняет недопустимую форму $value", ({ value }) => {
    expect(schema.Check(value)).toBe(false)
  })
})
