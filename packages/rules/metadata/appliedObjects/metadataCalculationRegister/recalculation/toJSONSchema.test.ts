import { beforeAll, describe, expect, it } from "vitest"

import { mockContext } from "../../../../tests/mockContext"
import { metadataRules } from "../../../composition/metadataRules"
import {
  createMetadataExecutionRegistrySets,
  withMetadataExecutionRegistrySets,
} from "../../../composition/metadataExecutionContext"
import { exportMetadataItemToJSONSchema } from "../../../ruleRuntime/metadataItem/toJSONSchema"
import { compileValidationSchema } from "../../../validation/compileValidationSchema"
import { RecalculationRules } from "./rules"

let schema: ReturnType<typeof compileValidationSchema>

describe("Recalculation JSON Schema", () => {
  beforeAll(() => {
    schema = withMetadataExecutionRegistrySets(
      createMetadataExecutionRegistrySets(metadataRules),
      () => compileValidationSchema(exportMetadataItemToJSONSchema({
        context: mockContext,
        rule: RecalculationRules,
      })),
    )
  })

  it("accepts semantic recalculation properties", () => {
    expect(schema.Check({
      Синоним: "Перерасчет все свойства",
      Комментарий: "Комментарий",
      РежимУправленияБлокировкойДанных: "Автоматический",
      Измерения: {
        ИзмерениеПерерасчетаВсеСвойства: {
          ИзмерениеРегистра: "ИзмерениеВсеСвойства",
          ДанныеВедущихРегистров: ["ИзмерениеВсеСвойства"],
        },
      },
    })).toBe(true)
  })

  it("rejects removed and unknown properties", () => {
    expect(schema.Check({ Использование: "Истина" })).toBe(false)
    expect(schema.Check({ НеизвестноеПоле: "значение" })).toBe(false)
  })
})
