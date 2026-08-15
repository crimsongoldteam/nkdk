import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  testMetadataItemFromXMLToYAML,
} from "../../../../tests/directConversion"
import { RecalculationRules } from "./rules"
import { metadataRules } from "../../../composition/metadataRules"
import {
  createMetadataExecutionRegistrySets,
  withMetadataExecutionRegistrySets,
} from "../../../composition/metadataExecutionContext"

import "./register"

describe("Recalculation XML → YAML", () => {
  it("imports recalculation properties", () => {
    const result = testMetadataItemFromXMLToYAML({
      rule: RecalculationRules,
      xml: {
        _uuid: "46548bba-f23d-42e4-9c54-83d85954c94f",
        Properties: {
          Name: "ПерерасчетПоУмолчанию",
          Synonym: "",
          Comment: "",
          DataLockControlMode: "Managed",
        },
        ChildObjects: {},
      },
    }).yaml

    expect(result).toEqual({ Синоним: "", Комментарий: "" })
  })

  it("imports recalculation dimensions as links instead of register fields", () => {
    const context = createDirectRoundTripContexts({
      metadataTargetOwners: [{
        itemType: "MetadataCalculationRegisterRecalculationDimension",
        name: "ИзмерениеПерерасчетаВсеСвойства",
        owner: { root: "CalculationRegister", objectName: "РегистрРасчетаВсеСвойства" },
      }],
    }).importContext
    const result = withMetadataExecutionRegistrySets(createMetadataExecutionRegistrySets(metadataRules), () =>
      testMetadataItemFromXMLToYAML({
      rule: RecalculationRules,
      context,
      xml: {
        Properties: {
          Name: "ПерерасчетВсеСвойства",
          Synonym: "",
          Comment: "",
          DataLockControlMode: "Managed",
        },
        ChildObjects: {
          Dimension: {
            _uuid: "5684dcd4-1685-4fc0-879a-c584a0768a94",
            Properties: {
              Name: "ИзмерениеПерерасчетаВсеСвойства",
              Synonym: { "v8:item": { "v8:lang": "ru", "v8:content": "Синоним" } },
              Comment: "Комментарий",
              RegisterDimension:
                "CalculationRegister.РегистрРасчетаВсеСвойства.Dimension.ИзмерениеВсеСвойства",
              LeadingRegisterData: {
                "xr:Item": [
                  {
                    "_xsi:type": "xr:MDObjectRef",
                    "#text": "CalculationRegister.РегистрРасчетаВсеСвойства.Dimension.ИзмерениеВсеСвойства",
                  },
                  {
                    "_xsi:type": "xr:MDObjectRef",
                    "#text": "CalculationRegister.РегистрРасчетаВедущий.Attribute.РеквизитВедущего",
                  },
                ],
              },
            },
          },
        },
      },
      }).yaml)

    expect(result).toEqual({
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
    })
  })
})
