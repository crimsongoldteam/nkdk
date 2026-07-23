import { describe, expect, it } from "vitest"

import { testMetadataItemFromXMLToYAML } from "../../../tests/directConversion"
import { RecalculationRules } from "./rules"

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

    expect(result).toEqual({ Комментарий: "" })
  })
})
