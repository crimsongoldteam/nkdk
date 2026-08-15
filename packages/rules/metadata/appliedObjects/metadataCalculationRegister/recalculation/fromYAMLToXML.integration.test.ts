import { describe, expect, it } from "vitest"

import { serializeDirectXML } from "../../../../tests/directConversion"
import { exportRecalculationYAML } from "./testSupport"

describe("Recalculation YAML → XML", () => {
  it("exports a semantic recalculation file", () => {
    const result = exportRecalculationYAML({
      metadataTargetOwners: [{
        itemType: "MetadataCalculationRegisterRecalculationDimension",
        name: "ИзмерениеПерерасчетаВсеСвойства",
        owner: { root: "CalculationRegister", objectName: "РегистрРасчетаВсеСвойства" },
      }],
      yaml: {
        Синоним: "Синоним",
        Комментарий: "Комментарий",
        РежимУправленияБлокировкойДанных: "Автоматический",
        Измерения: {
          ИзмерениеПерерасчетаВсеСвойства: {
            ИзмерениеРегистра: "ИзмерениеВсеСвойства",
            ДанныеВедущихРегистров: ["ИзмерениеВсеСвойства"],
          },
        },
      },
    })

    expect(result.xml).toMatchObject({
      MetaDataObject: {
        Recalculation: {
          Properties: {
            Name: "ПерерасчетВсеСвойства",
            Comment: "Комментарий",
            DataLockControlMode: "Automatic",
          },
          ChildObjects: {
            Dimension: [{
              Properties: {
                Name: "ИзмерениеПерерасчетаВсеСвойства",
                RegisterDimension:
                  "CalculationRegister.РегистрРасчетаВсеСвойства.Dimension.ИзмерениеВсеСвойства",
              },
            }],
          },
        },
      },
    })
    expect(serializeDirectXML(result.xml)).not.toContain("<Use>")
  })
})
