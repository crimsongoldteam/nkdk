import { describe, expect, it } from "vitest"
import { serializeDirectXML } from "../../../../../tests/directConversion"
import { exportRecalculationYAML } from "../../../../../tests/recalculation"

describe("Recalculation dimension YAML → XML", () => {
  it("exports register links as MDObjectRef values", () => {
    const result = exportRecalculationYAML({
      metadataTargetOwners: [{
        itemType: "MetadataCalculationRegisterRecalculationDimension",
        name: "ИзмерениеПерерасчетаВсеСвойства",
        owner: { root: "CalculationRegister", objectName: "РегистрРасчетаВсеСвойства" },
      }],
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
    })

    expect(serializeDirectXML(result.xml)).toContain(
      "<RegisterDimension>CalculationRegister.РегистрРасчетаВсеСвойства.Dimension.ИзмерениеВсеСвойства</RegisterDimension>",
    )
    expect(serializeDirectXML(result.xml)).toContain(
      '<xr:Item xsi:type="xr:MDObjectRef">CalculationRegister.РегистрРасчетаВедущий.Attribute.РеквизитВедущего</xr:Item>',
    )
  })
})
