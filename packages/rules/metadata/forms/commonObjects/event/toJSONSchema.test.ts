import { describe, expect, it } from "vitest"
import { mockContext } from "../../../../tests/mockContext"
import { compileValidationSchema } from "../../../validation/compileValidationSchema"
import { eventsRule } from "./types"
import { exportEventsToJSONSchema } from "./toJSONSchema"
import { brokenEventReferenceCarrier } from "./brokenReference"
import { collectEventMetadataTargetOccurrences } from "./metadataTargetOccurrences"
import { markYAMLMappingKeyTag } from "@nkdk/runtime"

const rule = eventsRule({
  yaml: "События",
  items: { onChange: "ПриИзменении" },
})

describe("схема JSON для событий", () => {
  it("принимает строковый обработчик или непустой объект режимов", () => {
    const schema = exportEventsToJSONSchema({ context: mockContext, rule, value: undefined })
    if (schema === undefined) throw new Error("Ожидалась схема событий")
    const Check = compileValidationSchema(schema).Check

    expect(Check({ ПриИзменении: "Обработчик" })).toBe(true)
    expect(Check({ ПриИзменении: { Перед: "Перед", После: "После" } })).toBe(true)
    expect(Check({ ПриИзменении: { Вместо: "Вместо" } })).toBe(true)
    expect(Check({ ПриИзменении: { Auto: "Обработчик" } })).toBe(false)
    expect(Check({ ПриИзменении: {} })).toBe(false)
    expect(Check({ ПриИзменении: { Перед: 1 } })).toBe(false)
  })

  it("разрешает в графе проверки строгий UUID-ключ и отклоняет произвольный ключ", () => {
    const base = exportEventsToJSONSchema({ context: mockContext, rule, value: undefined })
    if (base === undefined) throw new Error("Ожидалась схема событий")
    const schema = brokenEventReferenceCarrier.validationSchema({
      rule,
      base,
      validationGraph: true,
    })
    const Check = compileValidationSchema(schema).Check

    expect(Check({ "047d4d09-961c-4bdc-8519-eef10674c35b": "ПослеЗаписи" })).toBe(true)
    expect(Check({ НеизвестноеСобытие: "Обработчик" })).toBe(false)
  })

  it("перечисляет UUID как битую ссылку и не перечисляет обычное событие", () => {
    const uuid = "047d4d09-961c-4bdc-8519-eef10674c35b"
    const events = { [uuid]: "ПослеЗаписи", ПриИзменении: "ПриИзменении" }
    markYAMLMappingKeyTag(events, uuid, "xml/reference")

    expect(collectEventMetadataTargetOccurrences({
      value: events,
      representation: "yaml",
      yamlPath: ["События"],
      propRule: rule,
    })).toMatchObject([{
      location: { kind: "key", path: ["События"], key: uuid },
      representation: { kind: "brokenXMLReference", payload: uuid, grammar: "uuid" },
    }])
  })
})
