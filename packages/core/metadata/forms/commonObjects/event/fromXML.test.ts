import { describe, expect, it } from "vitest"
import { createConfigurationIndexCollector } from "../../../configurationIndex/collector/writer"
import { withConfigurationIndexCollector } from "../../../configurationIndex/collector/context"
import { getTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { InputFieldRules } from "../../elements/inputField/rules"
import { eventBindingKey } from "./callType"
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

  it("запоминает составные ключи и aliases XML-привязок", () => {
    const collector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(mockContextFromXML(), collector, "Форма.События")
    const collect = getTypeRule("Events", "collectConfigurationIndexFromXML")

    collect?.({
      context,
      rule: eventsRule,
      propertyKey: "events",
      xml: {
        Event: [
          { _name: "OnChange", _callType: "Before", "#text": "ПередИзменением" },
          { _name: "OnChange", _callType: "After", "#text": "ПослеИзменения" },
          { _name: "НачалоВыбора", _callType: "Override", "#text": "НачалоВыбора" },
        ],
      },
    })

    const [node] = collector.fragment("Форма.yaml").xmlNodes
    expect(node).toEqual({
      logicalAddress: "Форма.События",
      order: [
        eventBindingKey("onChange", "Before"),
        eventBindingKey("onChange", "After"),
        eventBindingKey("startChoice", "Override"),
      ],
      aliases: {
        [eventBindingKey("startChoice", "Override")]: "НачалоВыбора",
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
})
