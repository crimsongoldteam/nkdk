import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { importStandardPeriodFromXML } from "./fromXML"
import { importStandardPeriodFromYAML } from "./fromYAML"
import { exportStandardPeriodToXML } from "./toXML"
import { exportStandardPeriodToYAML } from "./toYAML"

describe("StandardPeriod", () => {
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
