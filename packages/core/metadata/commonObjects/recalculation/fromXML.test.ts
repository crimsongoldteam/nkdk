import { describe, expect, it } from "vitest"
import { importMetadataItemFromXML } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"
import { RecalculationRules } from "./rules"
import { Recalculation } from "./types"

describe("import Recalculation from XML", () => {
  it("imports recalculation properties", () => {
    const result = importMetadataItemFromXML({
      context: mockContextFromXML(),
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
    }) as Recalculation | undefined

    expect(result?.itemType).toBe("Recalculation")
    expect(result?.name).toBe("ПерерасчетПоУмолчанию")
    expect(result?.dataLockControlMode).toBeUndefined()
  })
})
