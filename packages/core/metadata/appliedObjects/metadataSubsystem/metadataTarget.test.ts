import { describe, expect, it } from "vitest"
import { exportMetadataItemToYAML, importMetadataItemFromYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { MetadataSubsystemRules } from "./rules"

describe("MetadataSubsystem metadataTarget", () => {
  it("imports nested subsystem links in content", () => {
    expect(
      importMetadataItemFromYAML({
        context: mockContext,
        rule: MetadataSubsystemRules,
        name: "СтандартныеПодсистемы",
        yaml: {
          Состав: ["Подсистема.СтандартныеПодсистемы.Подсистема.КалендарныеГрафики"],
        },
      })
    ).toMatchObject({
      content: ["Subsystem.СтандартныеПодсистемы.Subsystem.КалендарныеГрафики"],
    })
  })

  it("exports nested subsystem links in content", () => {
    expect(
      exportMetadataItemToYAML({
        context: mockContext,
        rule: MetadataSubsystemRules,
        data: {
          itemType: "MetadataSubsystem",
          name: "СтандартныеПодсистемы",
          content: ["Subsystem.СтандартныеПодсистемы.Subsystem.КалендарныеГрафики"],
        },
      })
    ).toMatchObject({
      Состав: ["Подсистема.СтандартныеПодсистемы.Подсистема.КалендарныеГрафики"],
    })
  })
})
