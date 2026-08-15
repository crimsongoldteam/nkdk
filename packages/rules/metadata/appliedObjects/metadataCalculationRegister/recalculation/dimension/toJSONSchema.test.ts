import { beforeAll, describe, expect, it } from "vitest"
import { mockContext } from "../../../../../tests/mockContext"
import { metadataRules } from "../../../../composition/metadataRules"
import {
  createMetadataExecutionRegistrySets,
  withMetadataExecutionRegistrySets,
} from "../../../../composition/metadataExecutionContext"
import { exportMetadataItemToJSONSchema } from "../../../../ruleRuntime/metadataItem/toJSONSchema"
import { compileValidationSchema } from "../../../../validation/compileValidationSchema"
import { MetadataCalculationRegisterRecalculationDimensionRules } from "./rules"

let schema: ReturnType<typeof compileValidationSchema>

describe("Recalculation dimension JSON Schema", () => {
  beforeAll(() => {
    schema = withMetadataExecutionRegistrySets(
      createMetadataExecutionRegistrySets(metadataRules),
      () => compileValidationSchema(exportMetadataItemToJSONSchema({
        context: mockContext,
        rule: MetadataCalculationRegisterRecalculationDimensionRules,
      })),
    )
  })

  it("accepts current dimension and external calculation register fields", () => {
    const yaml = {
      ИзмерениеРегистра: "ИзмерениеВсеСвойства",
      ДанныеВедущихРегистров: [
        "ИзмерениеВсеСвойства",
        "РегистрРасчета.РегистрРасчетаВедущий.Измерение.ИзмерениеПараметрыВыбора",
        "РегистрРасчета.РегистрРасчетаВедущий.Реквизит.РеквизитВедущего",
      ],
    }
    expect(schema.Check(yaml)).toBe(true)
  })

  it.each([
    ["current attribute", { ИзмерениеРегистра: "Реквизит.Организация" }],
    ["foreign dimension", {
      ИзмерениеРегистра: "РегистрРасчета.РегистрРасчетаВедущий.Измерение.ИзмерениеПараметрыВыбора",
    }],
    ["calculation register resource", {
      ИзмерениеРегистра: "ИзмерениеВсеСвойства",
      ДанныеВедущихРегистров: ["РегистрРасчета.РегистрРасчетаВедущий.Ресурс.Сумма"],
    }],
    ["catalog attribute", {
      ИзмерениеРегистра: "ИзмерениеВсеСвойства",
      ДанныеВедущихРегистров: ["Справочник.Контрагенты.Реквизит.ИНН"],
    }],
  ])("rejects %s", (_caseName, yaml) => {
    expect(schema.Check(yaml)).toBe(false)
  })
})
