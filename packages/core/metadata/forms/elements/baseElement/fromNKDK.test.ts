import { describe, expect, it } from "vitest"

import { importFormFromNKDK, testimportElementFromNKDK } from "~/tests/fromNKDK"
import { mockContext } from "~/tests/mockContext"

describe("import other field from structure", () => {
  it("should import other element from structure", async () => {
    const result = await testimportElementFromNKDK(mockContext, "?ПолеПереключателя %ИмяПоля")

    expect(result).toEqual({
      itemType: "RadioButtonField",
      name: "ИмяПоля",
    })
  })

  it("should import ordinary view status addition from command addition field", async () => {
    const form = await importFormFromNKDK(
      mockContext,
      "<?ОтображениеСостоянияПросмотра СписокСостояниеПросмотра> КоманднаяПанель",
    )
    const commandBar = form?.childItems[0]

    if (commandBar?.itemType !== "CommandBar") {
      throw new Error("Expected CommandBar")
    }

    expect(commandBar).toMatchObject({
      itemType: "CommandBar",
      childItems: [
        {
          itemType: "ViewStatusAddition",
          name: "СписокСостояниеПросмотра",
        },
      ],
    })
    expect(commandBar.childItems[0]).toEqual({
      itemType: "ViewStatusAddition",
      name: "СписокСостояниеПросмотра",
    })
  })

  it("should import command addition fields inside ordinary group", async () => {
    const form = await importFormFromNKDK(mockContext, [
      "+Группа",
      "  ?ОтображениеСтрокиПоиска СтрокаПоиска",
      "  ?УправлениеПоиском УправлениеПоиском",
      "  ?ОтображениеСостоянияПросмотра СостояниеПросмотра",
    ])
    const group = form?.childItems[0]

    if (group?.itemType !== "UsualGroup") {
      throw new Error("Expected UsualGroup")
    }

    expect(group.childItems).toEqual([
      {
        itemType: "SearchStringAddition",
        name: "СтрокаПоиска",
      },
      {
        itemType: "SearchControlAddition",
        name: "УправлениеПоиском",
        childItems: [],
      },
      {
        itemType: "ViewStatusAddition",
        name: "СостояниеПросмотра",
      },
    ])
  })
})
