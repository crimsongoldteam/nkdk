import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { InputFieldRules } from "../../elements/inputField/rules"
import { importEventsFromXML } from "./fromXML"

const eventsRule = InputFieldRules.properties.events

describe("import Events from XML", () => {
  it("собирает обработчики одного события по callType", () => {
    const result = importEventsFromXML(mockContextFromXML(), eventsRule, {
      Event: [
        { _name: "OnChange", _callType: "Before", "#text": "ПередИзменением" },
        { _name: "OnChange", _callType: "After", "#text": "ПослеИзменения" },
        { _name: "StartChoice", _callType: "Override", "#text": "ВместоВыбора" },
      ],
    })

    expect(result).toEqual({
      onChange: {
        Before: "ПередИзменением",
        After: "ПослеИзменения",
      },
      startChoice: {
        Override: "ВместоВыбора",
      },
    })
  })

  it("сохраняет обычное событие строкой", () => {
    const result = importEventsFromXML(mockContextFromXML(), eventsRule, {
      Event: { _name: "OnChange", "#text": "ПриИзменении" },
    })

    expect(result).toEqual({ onChange: "ПриИзменении" })
  })

  it("отклоняет Auto с XML-именем события и значением callType", () => {
    expect(() =>
      importEventsFromXML(mockContextFromXML(), eventsRule, {
        Event: { _name: "VendorEvent", _callType: "Auto", "#text": "Обработчик" },
      })
    ).toThrow("Недопустимый callType XML-события VendorEvent: Auto")
  })

  it("группирует режимы неизвестного XML-события по его имени", () => {
    const result = importEventsFromXML(mockContextFromXML(), eventsRule, {
      Event: [
        { _name: "VendorEvent", _callType: "Before", "#text": "ПередVendorEvent" },
        { _name: "VendorEvent", _callType: "After", "#text": "ПослеVendorEvent" },
      ],
    })

    expect(result).toEqual({
      vendorEvent: {
        Before: "ПередVendorEvent",
        After: "ПослеVendorEvent",
      },
    })
  })

  it.each([
    [
      "обычную и режимную привязки одного события",
      [
        { _name: "OnChange", "#text": "ПриИзменении" },
        { _name: "OnChange", _callType: "Before", "#text": "ПередИзменением" },
      ],
    ],
    [
      "повтор одной режимной привязки",
      [
        { _name: "OnChange", _callType: "Before", "#text": "ПередИзменением" },
        { _name: "OnChange", _callType: "Before", "#text": "ДругоеПередИзменением" },
      ],
    ],
  ])("отклоняет противоречивый XML: %s", (_description, events) => {
    expect(() => importEventsFromXML(mockContextFromXML(), eventsRule, { Event: events })).toThrow(
      "Противоречивые XML-привязки события"
    )
  })

  it.each([
    [
      "повтор режима",
      [
        { _name: "VendorEvent", _callType: "Before", "#text": "ПервыйОбработчик" },
        { _name: "VendorEvent", _callType: "Before", "#text": "ВторойОбработчик" },
      ],
    ],
    [
      "обычную и режимную привязки",
      [
        { _name: "VendorEvent", "#text": "ОбычныйОбработчик" },
        { _name: "VendorEvent", _callType: "Before", "#text": "РежимныйОбработчик" },
      ],
    ],
  ])("отклоняет конфликт неизвестного XML-события: %s", (_description, events) => {
    expect(() => importEventsFromXML(mockContextFromXML(), eventsRule, { Event: events })).toThrow(
      "Противоречивые XML-привязки события vendorEvent"
    )
  })
})
