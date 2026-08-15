import { describe, expect, it } from "vitest"

import {
  createDirectAdoptedExportContext,
  serializeDirectXML,
} from "../../../../tests/directConversion"
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

  it("keeps sparse adopted recalculation links absent", () => {
    const logicalAddress =
      "CalculationRegister.Основной.Recalculation.ПерерасчетВсеСвойства"
    const childLogicalAddress =
      `${logicalAddress}.Измерение.Заимствованное`
    const adopted = createDirectAdoptedExportContext(logicalAddress)
    const context = {
      ...adopted,
      exportToXML: {
        ...adopted.exportToXML,
        adoptedUuids: {
          [logicalAddress]: "fe3ce121-d6fc-409c-9b83-19e551d26b21",
          [childLogicalAddress]: "5684dcd4-1685-4fc0-879a-c584a0768a94",
        },
        xmlDefaultVariantByLogicalAddress: {
          [logicalAddress]: "adopted" as const,
          [childLogicalAddress]: "adopted" as const,
        },
      },
    }
    const result = exportRecalculationYAML({
      metadataTargetOwners: [],
      logicalAddress,
      context,
      yaml: {
        Измерения: {
          Заимствованное: {},
        },
      },
      referenceXML: {
        MetaDataObject: {
          Recalculation: {
            Properties: {
              ObjectBelonging: "Adopted",
              Name: "ПерерасчетВсеСвойства",
              ExtendedConfigurationObject: "fe3ce121-d6fc-409c-9b83-19e551d26b21",
            },
            ChildObjects: {
              Dimension: [{
                Properties: {
                  ObjectBelonging: "Adopted",
                  Name: "Заимствованное",
                  ExtendedConfigurationObject: "5684dcd4-1685-4fc0-879a-c584a0768a94",
                },
              }],
            },
          },
        },
      },
    })

    expect(result.xml).toMatchObject({
      MetaDataObject: {
        Recalculation: {
          Properties: {
            ObjectBelonging: "Adopted",
            ExtendedConfigurationObject: "fe3ce121-d6fc-409c-9b83-19e551d26b21",
          },
          ChildObjects: {
            Dimension: [expect.objectContaining({
              Properties: expect.objectContaining({
                ObjectBelonging: "Adopted",
                ExtendedConfigurationObject: "5684dcd4-1685-4fc0-879a-c584a0768a94",
              }),
            })],
          },
        },
      },
    })
    expect(serializeDirectXML(result.xml)).not.toContain("<RegisterDimension>")
    expect(serializeDirectXML(result.xml)).not.toContain("<LeadingRegisterData>")
  })
})
