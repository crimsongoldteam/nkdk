import { describe, expect, it } from "vitest"
import { importContentFromXML, parseXmlDocumentWithSaxes } from "@nkdk/runtime"
import type { StandardPeriodXML } from "./types"
import { mockContext } from "../../../tests/mockContext"
import { importStandardPeriodFromXML } from "./fromXML"
import { importStandardPeriodFromYAML } from "./fromYAML"
import { exportStandardPeriodToXML } from "./toXML"
import { exportStandardPeriodToYAML } from "./toYAML"

describe("StandardPeriod", () => {
  it.each([
    ["", undefined],
    ["<v8:variant/>", undefined],
    ["<v8:variant><![CDATA[]]></v8:variant>", undefined],
    ["<v8:variant>Custom</v8:variant><v8:startDate/><v8:endDate/>", { variant: "Custom" }],
    ['<v8:variant xsi:type="v8:StandardPeriodVariant"/>', undefined],
    ["<v8:variant>Today</v8:variant>", { variant: "Today" }],
    ['<v8:variant xsi:type="v8:StandardPeriodVariant">Custom</v8:variant><v8:startDate>0001-01-01T00:00:00</v8:startDate><v8:endDate>2026-09-06T00:00:00</v8:endDate>', { variant: "Custom", startDate: "0001-01-01T00:00:00", endDate: "2026-09-06T00:00:00" }],
  ])("reads structural period %s", (xml, expected) => {
    const node = parseXmlDocumentWithSaxes(`<Value>${xml}</Value>`).roots[0]!
    Object.defineProperty(node, "compatibilityValue", { get() { throw new Error("Compatibility XML must not be read") } })
    expect(importStandardPeriodFromXML(node)).toEqual(expected)
    expect(importStandardPeriodFromXML(importContentFromXML<{ Value?: StandardPeriodXML }>(`<Value>${xml}</Value>`).Value)).toEqual(expected)
  })

  it("round-trips custom period through YAML", () => {
    const model = {
      variant: "Custom",
      startDate: "0001-01-01T00:00:00",
      endDate: "0001-01-01T00:00:00",
    } as const

    const yaml = exportStandardPeriodToYAML(model)
    expect(yaml).toEqual({
      Вариант: "ПроизвольныйПериод",
      ДатаНачала: "01.01.0001 00:00:00",
      ДатаОкончания: "01.01.0001 00:00:00",
    })
    expect(importStandardPeriodFromYAML(mockContext, undefined, yaml)).toEqual(model)
  })

  it("round-trips period variant without dates through XML", () => {
    const xml = {
      "_xsi:type": "v8:StandardPeriod",
      "v8:variant": { "_xsi:type": "v8:StandardPeriodVariant", "#text": "Today" },
    } as const

    const model = importStandardPeriodFromXML(xml)
    expect(model).toEqual({ variant: "Today" })
    expect(exportStandardPeriodToXML(model)).toEqual(xml)
  })

  it("round-trips period variant without dates through YAML", () => {
    const model = { variant: "Today" } as const

    const yaml = exportStandardPeriodToYAML(model)
    expect(yaml).toEqual({ Вариант: "Сегодня" })
    expect(importStandardPeriodFromYAML(mockContext, undefined, yaml)).toEqual(model)
  })
})
