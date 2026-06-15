import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { importPropertiesFromYAML } from "./fromYAML"
import { exportPropertiesToYAML } from "./toYAML"
import type { MetadataItemRule } from "./types"

const documentRule = {
  itemType: "MetadataDocument",
  itemTypePrefix: "Документ",
  properties: {
    name: { type: "string", defaultValue: ({ name }: { name?: string }) => name },
    comment: {
      yaml: "Комментарий",
      type: "string",
    },
    defaultObjectForm: {
      yaml: "ОсновнаяФормаОбъекта",
      type: "string",
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"] },
    },
  },
} as const satisfies MetadataItemRule

describe("string metadataTarget YAML", () => {
  it("exports canonical local member strings to short YAML", () => {
    expect(
      exportPropertiesToYAML({
        context: mockContext,
        rule: documentRule,
        data: {
          itemType: "MetadataDocument",
          name: "АвансовыйОтчет",
          defaultObjectForm: "Document.АвансовыйОтчет.Form.ФормаДокумента",
        },
      })
    ).toEqual({
      ОсновнаяФормаОбъекта: "ФормаДокумента",
    })
  })

  it("imports short YAML member strings to canonical model strings", () => {
    expect(
      importPropertiesFromYAML({
        context: mockContext,
        metadataRule: documentRule,
        name: "АвансовыйОтчет",
        yaml: { ОсновнаяФормаОбъекта: "ФормаДокумента" },
      })
    ).toMatchObject({
      defaultObjectForm: "Document.АвансовыйОтчет.Form.ФормаДокумента",
    })
  })

  it("keeps ordinary string properties unchanged", () => {
    expect(
      exportPropertiesToYAML({
        context: mockContext,
        rule: documentRule,
        data: {
          itemType: "MetadataDocument",
          name: "АвансовыйОтчет",
          comment: "Document.АвансовыйОтчет.Form.ФормаДокумента",
        },
      })
    ).toEqual({
      Комментарий: "Document.АвансовыйОтчет.Form.ФормаДокумента",
    })

    expect(
      importPropertiesFromYAML({
        context: mockContext,
        metadataRule: documentRule,
        name: "АвансовыйОтчет",
        yaml: { Комментарий: "ФормаДокумента" },
      })
    ).toMatchObject({
      comment: "ФормаДокумента",
    })
  })

  it("rejects local member strings when owner context is unavailable on import", () => {
    expect(() =>
      importPropertiesFromYAML({
        context: mockContext,
        metadataRule: documentRule,
        yaml: { ОсновнаяФормаОбъекта: "ФормаДокумента" },
      })
    ).toThrow('Для metadataTarget kind "member" owner "this" требуется контекст текущего объекта')
  })

  it("rejects local member strings when owner context is unavailable on export", () => {
    expect(() =>
      exportPropertiesToYAML({
        context: mockContext,
        rule: documentRule,
        data: {
          itemType: "MetadataDocument",
          name: "",
          defaultObjectForm: "Document.АвансовыйОтчет.Form.ФормаДокумента",
        },
      })
    ).toThrow('Для metadataTarget kind "member" owner "this" требуется контекст текущего объекта')
  })

  it("rejects YAML strings that do not match a member target", () => {
    expect(() =>
      importPropertiesFromYAML({
        context: mockContext,
        metadataRule: documentRule,
        name: "АвансовыйОтчет",
        yaml: { ОсновнаяФормаОбъекта: "ОбщаяФорма.ФормаДокумента" },
      })
    ).toThrow()
  })

  it("rejects model strings that do not match a member target", () => {
    expect(() =>
      exportPropertiesToYAML({
        context: mockContext,
        rule: documentRule,
        data: {
          itemType: "MetadataDocument",
          name: "АвансовыйОтчет",
          defaultObjectForm: "CommonForm.ФормаДокумента",
        },
      })
    ).toThrow()
  })
})
