import { describe, expect, it } from "vitest"
import type { BaseFormProjectionContext } from "./baseFormProjectionRegistry"
import {
  createStructuredBaseFormPropertyProjector,
  projectProperty,
} from "./baseFormProjectionRegistry"


const context: BaseFormProjectionContext = {
  attributeNames: new Set(["Объект"]),
  commandNames: new Set(["Команда1"]),
  parameterNames: new Set(["Параметр1"]),
}

describe("BaseForm property projection registry", () => {
  it("keeps the cf value for a property without registered projection behavior", () => {
    expect(
      projectProperty({
        rule: { type: "string" },
        baseValue: "Значение основы",
        extensionValue: "Значение расширения",
        context,
      })
    ).toEqual({ kind: "include", value: "Значение основы" })
  })

  it("omits events even when both forms contain them", () => {
    expect(
      projectProperty({
        rule: { type: "Events" },
        baseValue: { onChange: "ОсновнойОбработчик" },
        extensionValue: { onChange: "РасширениеОбработчик" },
        context,
      })
    ).toEqual({ kind: "omit" })
  })

  it("omits DataPath when its root attribute is unavailable", () => {
    expect(
      projectProperty({
        rule: { type: "DataPath" },
        baseValue: "Объект.Код",
        extensionValue: "Объект2.Код",
        context: { ...context, attributeNames: new Set() },
      })
    ).toEqual({ kind: "omit" })
  })

  it("omits an early-resolved DataPath when its root attribute is unavailable", () => {
    expect(
      projectProperty({
        rule: { type: "DataPath" },
        baseValue: "Items.Таблица.CurrentData.Код",
        extensionValue: "Items.Таблица.CurrentData.Код",
        context: { ...context, attributeNames: new Set() },
      })
    ).toEqual({ kind: "omit" })
  })

  it("keeps the cf DataPath when its root attribute is available", () => {
    expect(
      projectProperty({
        rule: { type: "DataPath" },
        baseValue: "Объект.Код",
        extensionValue: "Объект.ДругойКод",
        context,
      })
    ).toEqual({ kind: "include", value: "Объект.Код" })
  })

  it.each(["", "0"])("keeps the non-reference DataPath value %j", (baseValue) => {
    expect(
      projectProperty({
        rule: { type: "DataPath" },
        baseValue,
        extensionValue: baseValue,
        context: { ...context, attributeNames: new Set() },
      })
    ).toEqual({ kind: "include", value: baseValue })
  })

  it("uses the empty command reference when the command is unavailable", () => {
    expect(
      projectProperty({
        rule: { type: "CommandName" },
        baseValue: "Команда1",
        extensionValue: "Команда1",
        context: { ...context, commandNames: new Set() },
      })
    ).toEqual({ kind: "include", value: "0" })
  })

  it("keeps the cf command name when the command is available", () => {
    expect(
      projectProperty({
        rule: { type: "CommandName" },
        baseValue: "Команда1",
        extensionValue: "ДругаяКоманда",
        context,
      })
    ).toEqual({ kind: "include", value: "Команда1" })
  })

  it("keeps the empty command reference", () => {
    expect(
      projectProperty({
        rule: { type: "CommandName" },
        baseValue: "0",
        extensionValue: "0",
        context: { ...context, commandNames: new Set() },
      })
    ).toEqual({ kind: "include", value: "0" })
  })

  it("keeps the extension sentinel instead of restoring a cf standard command", () => {
    expect(
      projectProperty({
        rule: { type: "CommandName" },
        baseValue: "Form.StandardCommand.ShowInList",
        extensionValue: "0",
        context: { ...context, commandNames: new Set() },
      })
    ).toEqual({ kind: "include", value: "0" })
  })

  it("rejects an unavailable local reference without registered projection behavior", () => {
    expect(() =>
      projectProperty({
        rule: {
          type: "UnregisteredAttributeReference",
          metadataTarget: {
            kind: "member",
            owner: "this",
            memberKinds: ["Attribute"],
          },
        },
        baseValue: "СкрытыйРеквизит",
        extensionValue: "СкрытыйРеквизит",
        context,
      })
    ).toThrow(/UnregisteredAttributeReference/)
  })

  it("rejects an unregistered reference inside a structured property", () => {
    const projector = createStructuredBaseFormPropertyProjector({
      kind: "object",
      properties: {
        Ссылка: {
          kind: "reference",
          type: "UnregisteredAttributeReference",
        },
      },
    })

    expect(() =>
      projector.project({
        rule: { type: "string" },
        baseValue: { Ссылка: "СкрытыйРеквизит" },
        extensionValue: { Ссылка: "СкрытыйРеквизит" },
        context,
      })
    ).toThrow(/UnregisteredAttributeReference/)
  })
})
