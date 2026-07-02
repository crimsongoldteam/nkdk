import { describe, expect, it } from "vitest"
import { importPropertiesFromXML } from "../../../orchestration/property/fromXML"
import { exportPropertiesToXML } from "../../../orchestration/property/toXML"
import { mockContextFromXML, mockContextToXML } from "../../../../tests/mockContext"
import { PopupRules } from "./rules"
import type { Popup } from "./types"

const basePopup = {
  itemType: "Popup",
  name: "ВидВладельцаЭЦП",
  width: 22,
  childItems: [],
} satisfies Popup

function importReferencePopup(xml: Record<string, unknown>): Popup {
  const imported = importPropertiesFromXML({
    context: mockContextFromXML({ forReference: true }),
    rule: PopupRules,
    xml,
  })

  return {
    itemType: "Popup",
    ...(imported === undefined ? {} : imported),
  } as Popup
}

function exportPopup(params: { popup: Popup; referencePopup?: Popup }): Record<string, unknown> {
  return exportPropertiesToXML({
    context: mockContextToXML(),
    metadata: params.popup,
    referenceMetadata: params.referencePopup,
    rule: PopupRules,
  }) as Record<string, unknown>
}

describe("Popup auto color preservation from reference XML", () => {
  it("restores BackColor auto when model omits backColor and reference XML has auto", () => {
    const result = exportPopup({
      popup: basePopup,
      referencePopup: importReferencePopup({
        _name: "ВидВладельцаЭЦП",
        Width: 22,
        BackColor: "auto",
      }),
    })

    expect(result.BackColor).toBe("auto")
  })

  it("does not invent BackColor auto without reference XML key", () => {
    const result = exportPopup({
      popup: basePopup,
      referencePopup: importReferencePopup({
        _name: "ВидВладельцаЭЦП",
        Width: 22,
      }),
    })

    expect(result.BackColor).toBeUndefined()
  })

  it("exports model color instead of reference auto", () => {
    const result = exportPopup({
      popup: {
        ...basePopup,
        backColor: {
          type: "WebColor",
          value: "Red",
        },
      },
      referencePopup: importReferencePopup({
        _name: "ВидВладельцаЭЦП",
        Width: 22,
        BackColor: "auto",
      }),
    })

    expect(result.BackColor).toBe("web:Red")
  })
})
