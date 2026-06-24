import { describe, expect, it } from "vitest"
import { importPropertiesFromXML } from "~/metadata/orchestration/property/fromXML"
import { exportPropertiesToXML } from "~/metadata/orchestration/property/toXML"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { ButtonRules } from "./rules"
import type { Button } from "./types"

const baseButton = {
  itemType: "Button",
  name: "КнопкаСформировать",
  type: "UsualButton",
  defaultButton: true,
  skipOnInput: false,
  commandName: "Form.Command.Сформировать",
} satisfies Button

function importReferenceButton(xml: Record<string, unknown>): Button {
  const imported = importPropertiesFromXML({
    context: mockContextFromXML({ forReference: true }),
    rule: ButtonRules,
    xml,
  })

  return {
    itemType: "Button",
    ...(imported === undefined ? {} : imported),
  } as Button
}

function exportButton(params: { button: Button; referenceButton?: Button }): Record<string, unknown> {
  return exportPropertiesToXML({
    context: mockContextToXML(),
    metadata: params.button,
    referenceMetadata: params.referenceButton,
    rule: ButtonRules,
  }) as Record<string, unknown>
}

describe("Button auto color preservation from reference XML", () => {
  it("restores BackColor auto when model omits backColor and reference XML has auto", () => {
    const result = exportButton({
      button: baseButton,
      referenceButton: importReferenceButton({
        _name: "КнопкаСформировать",
        BackColor: "auto",
      }),
    })

    expect(result.BackColor).toBe("auto")
  })

  it("does not invent BackColor auto without reference", () => {
    const result = exportButton({
      button: baseButton,
    })

    expect(result.BackColor).toBeUndefined()
  })

  it("exports model color instead of reference auto", () => {
    const result = exportButton({
      button: {
        ...baseButton,
        backColor: {
          type: "WebColor",
          value: "Red",
        },
      },
      referenceButton: importReferenceButton({
        _name: "КнопкаСформировать",
        BackColor: "auto",
      }),
    })

    expect(result.BackColor).toBe("web:Red")
  })
})
