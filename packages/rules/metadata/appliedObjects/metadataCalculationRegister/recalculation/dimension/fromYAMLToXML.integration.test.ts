import { describe, expect, it } from "vitest"
import {
  createDirectRoundTripContexts,
  serializeDirectXML,
  testMetadataItemFromYAMLToXML,
} from "../../../../../tests/directConversion"
import {
  createMetadataExecutionRegistrySets,
  withMetadataExecutionRegistrySets,
} from "../../../../composition/metadataExecutionContext"
import { metadataRules } from "../../../../composition/metadataRules"
import { RecalculationRules } from "../rules"

describe("Recalculation dimension YAML → XML", () => {
  it("exports register links as MDObjectRef values", () => {
    const contexts = createDirectRoundTripContexts({
      metadataTargetOwners: [{
        itemType: "MetadataCalculationRegisterRecalculationDimension",
        name: "ИзмерениеПерерасчетаВсеСвойства",
        owner: { root: "CalculationRegister", objectName: "РегистрРасчетаВсеСвойства" },
      }],
    })
    const result = withMetadataExecutionRegistrySets(createMetadataExecutionRegistrySets(metadataRules), () =>
      testMetadataItemFromYAMLToXML({
        context: contexts.exportContext(),
        rule: RecalculationRules,
        name: "ПерерасчетВсеСвойства",
        yaml: {
          Синоним: "",
          Комментарий: "",
          Измерения: {
            ИзмерениеПерерасчетаВсеСвойства: {
              Синоним: "Синоним",
              Комментарий: "Комментарий",
              ИзмерениеРегистра: "ИзмерениеВсеСвойства",
              ДанныеВедущихРегистров: [
                "ИзмерениеВсеСвойства",
                "РегистрРасчета.РегистрРасчетаВедущий.Реквизит.РеквизитВедущего",
              ],
            },
          },
        },
      }))

    expect(serializeDirectXML(result.xml)).toContain(
      "<RegisterDimension>CalculationRegister.РегистрРасчетаВсеСвойства.Dimension.ИзмерениеВсеСвойства</RegisterDimension>",
    )
    expect(serializeDirectXML(result.xml)).toContain(
      '<xr:Item xsi:type="xr:MDObjectRef">CalculationRegister.РегистрРасчетаВедущий.Attribute.РеквизитВедущего</xr:Item>',
    )
  })
})
