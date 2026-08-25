import { describe,expect,it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import "./register"
import { ClientApplicationInterfaceRules } from "./rules"


describe("ClientApplicationInterfaceItems JSON Schema", () => {
  it("проверяет ОтображениеПанелиРазделов как системное перечисление", () => {
    const validation = compileValidationSchema(
      exportMetadataItemToJSONSchema({ context: mockContext, rule: ClientApplicationInterfaceRules })
    )

    expect(validation.Check({ ОтображениеПанелиРазделов: "Текст" })).toBe(true)
    expect(validation.Check({ ОтображениеПанелиРазделов: "Неизвестно" })).toBe(false)
  })
})
