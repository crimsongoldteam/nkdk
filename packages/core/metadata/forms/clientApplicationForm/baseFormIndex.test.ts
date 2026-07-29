import { describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "../../configurationIndex/encode"
import { childUid } from "../../configurationIndex/logicalAddress"
import {
  createConfigurationIndexReader,
  snapshotConfigurationIndex,
  type ConfigurationIndexReader,
} from "../../configurationIndex/sharedSnapshot"
import type { ConfigurationSnapshot, ConfigurationSnapshotEntity } from "../../configurationIndex/types"
import { createBaseFormConfigurationIndexReader } from "./baseFormIndex"

const formAddress = "Справочник.Товары.Форма.ФормаЭлемента"
const elementAddress = childUid(formAddress, "Элемент", "Код")
const attributeAddress = childUid(formAddress, "Атрибут", "Объект")
const commandAddress = childUid(formAddress, "Команда", "Обновить")
const parameterAddress = childUid(formAddress, "Параметр", "Отбор")

describe("BaseForm configuration index reader", () => {
  it("берёт identities выбранных компонентов из расширения, а остальные поля entity — из базы", () => {
    const base = reader("cf", [
      entity(elementAddress, "Форма.yaml", { identities: { xmlId: "4" }, xml: { explicitEmpty: true } }),
      entity(attributeAddress, "Форма.yaml", {
        identities: { xmlId: "5" },
        omittedChildren: { kind: "names", names: ["Поле"] },
        xml: { xsiNil: true },
      }),
      entity(commandAddress, "Форма.yaml", { identities: { xmlId: "6" } }),
      entity(parameterAddress, "Форма.yaml", { identities: { xmlId: "7" } }),
    ])
    const extension = reader("cfe/Дополнение", [
      entity(elementAddress, "Расширение.yaml", { identities: { xmlId: "1000000" }, xml: { xmlText: "extension" } }),
      entity(attributeAddress, "Расширение.yaml", {
        identities: { xmlId: "1000001" },
        omittedChildren: { kind: "names", names: ["Расширение"] },
        xml: { xmlText: "extension" },
      }),
      entity(commandAddress, "Расширение.yaml", { identities: { xmlId: "1000002" } }),
      entity(parameterAddress, "Расширение.yaml", { identities: { xmlId: "1000003" } }),
    ])

    const projected = createBaseFormConfigurationIndexReader({
      base,
      extension,
      extensionIdentityAddresses: new Set([attributeAddress, commandAddress, parameterAddress]),
    })

    expect(projected.entity(elementAddress)).toEqual(base.entity(elementAddress))
    expect(projected.entity(attributeAddress)).toEqual({
      logicalAddress: attributeAddress,
      sourceProjectPath: "Форма.yaml",
      identities: { xmlId: "1000001" },
      omittedChildren: { kind: "names", names: ["Поле"] },
      xml: { xsiNil: true },
    })
    expect(projected.entity(commandAddress)?.identities).toEqual({ xmlId: "1000002" })
    expect(projected.entity(parameterAddress)?.identities).toEqual({ xmlId: "1000003" })
  })

  it("не подставляет identity базы для выбранного адреса без identity расширения", () => {
    const base = reader("cf", [entity(attributeAddress, "Форма.yaml", { identities: { xmlId: "5" }, xml: { xsiNil: true } })])
    const extension = reader("cfe/Дополнение", [
      entity(attributeAddress, "Расширение.yaml", { xml: { xmlText: "extension" } }),
    ])
    const projected = createBaseFormConfigurationIndexReader({
      base,
      extension,
      extensionIdentityAddresses: new Set([attributeAddress]),
    })

    expect(projected.entity(attributeAddress)).toEqual({
      logicalAddress: attributeAddress,
      sourceProjectPath: "Форма.yaml",
      xml: { xsiNil: true },
    })
  })

  it("перечисляет ту же проекцию, что и точечное чтение, включая выбранную entity только расширения", () => {
    const extensionOnlyAddress = childUid(formAddress, "Команда", "ТолькоРасширение")
    const base = reader("cf", [
      entity(elementAddress, "Форма.yaml", { identities: { xmlId: "4" } }),
      entity(attributeAddress, "Форма.yaml", { identities: { xmlId: "5" } }),
    ])
    const extension = reader("cfe/Дополнение", [
      entity(attributeAddress, "Расширение.yaml", { identities: { xmlId: "1000001" }, xml: { xmlText: "не переносить" } }),
      entity(extensionOnlyAddress, "Расширение.yaml", {
        identities: { xmlId: "1000002" },
        xml: { xmlText: "не переносить" },
      }),
    ])
    const projected = createBaseFormConfigurationIndexReader({
      base,
      extension,
      extensionIdentityAddresses: new Set([attributeAddress, extensionOnlyAddress]),
    })

    expect([...projected.entities()]).toEqual(
      [attributeAddress, elementAddress, extensionOnlyAddress]
        .sort(compareUtf8)
        .map((logicalAddress) => projected.entity(logicalAddress))
    )
    expect(projected.entity(extensionOnlyAddress)).toEqual({
      logicalAddress: extensionOnlyAddress,
      sourceProjectPath: "Расширение.yaml",
      identities: { xmlId: "1000002" },
    })
    expect([...projected.entitiesBySourceProjectPath("Форма.yaml")]).toHaveLength(2)
  })

  it("делегирует header и files базовому снимку", () => {
    const base = reader("cf", [])
    const extension = reader("cfe/Дополнение", [])
    const projected = createBaseFormConfigurationIndexReader({
      base,
      extension,
      extensionIdentityAddresses: new Set(),
    })

    expect(projected.snapshot).toBe(base.snapshot)
    expect(projected.header()).toEqual(base.header())
    expect([...projected.files()]).toEqual([...base.files()])
    expect(projected.file("Форма.yaml")).toEqual(base.file("Форма.yaml"))
  })
})

function reader(componentPath: string, entities: readonly ConfigurationSnapshotEntity[]): ConfigurationIndexReader {
  const snapshot: ConfigurationSnapshot = {
    specificationVersion: "1.3",
    indexGeneration: 1n,
    componentPath,
    files: [
      { projectPath: "Форма.yaml", contentHash: 1n },
      { projectPath: "Расширение.yaml", contentHash: 2n },
    ],
    entities,
  }
  return createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(snapshot)))
}

function entity(
  logicalAddress: string,
  sourceProjectPath: string,
  fields: Omit<ConfigurationSnapshotEntity, "logicalAddress" | "sourceProjectPath">
): ConfigurationSnapshotEntity {
  return { logicalAddress, sourceProjectPath, ...fields }
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
}
