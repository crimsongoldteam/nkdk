import { describe, expect, it } from "vitest"
import { childUid, createLocalConfigurationIndexReader, type ConfigurationIndexBlockEntity } from "@nkdk/runtime"
import { createBaseFormConfigurationIndexReader } from "./baseFormIndex"

const formAddress = "Справочник.Товары.Форма.ФормаЭлемента"
const elementAddress = childUid(formAddress, "Элемент", "Код")
const attributeAddress = childUid(formAddress, "Атрибут", "Объект")

describe("BaseForm configuration index reader", () => {
  it("берёт идентификатор выбранного компонента из расширения, а остальных — из базы", () => {
    const projected = createBaseFormConfigurationIndexReader({
      base: reader([{ logicalAddress: elementAddress, xmlId: "4" }, { logicalAddress: attributeAddress, xmlId: "5" }]),
      extension: reader([{ logicalAddress: attributeAddress, xmlId: "1000001" }]),
      formLogicalAddress: formAddress,
      extensionIdentityAddresses: new Set([attributeAddress]),
    })
    expect(projected.entity(elementAddress)?.xmlId).toBe("4")
    expect(projected.entity(attributeAddress)?.xmlId).toBe("1000001")
  })

  it("не подставляет идентификатор базы для выбранного адреса без идентификатора расширения", () => {
    const projected = createBaseFormConfigurationIndexReader({
      base: reader([{ logicalAddress: attributeAddress, xmlId: "5" }]),
      extension: reader([{ logicalAddress: attributeAddress, children: [{ xmlName: "Form", name: "Поле" }] }]),
      formLogicalAddress: formAddress,
      extensionIdentityAddresses: new Set([attributeAddress]),
    })
    expect(projected.entity(attributeAddress)).toEqual({ logicalAddress: attributeAddress })
  })

  it("перечисляет ту же проекцию, что и точечное чтение", () => {
    const extensionOnly = childUid(formAddress, "Команда", "ТолькоРасширение")
    const projected = createBaseFormConfigurationIndexReader({
      base: reader([{ logicalAddress: elementAddress, xmlId: "4" }]),
      extension: reader([{ logicalAddress: extensionOnly, xmlId: "1000002" }]),
      formLogicalAddress: formAddress,
      extensionIdentityAddresses: new Set([extensionOnly]),
    })
    expect([...projected.entities()]).toEqual(expect.arrayContaining([
      projected.entity(elementAddress),
      projected.entity(extensionOnly),
    ]))
  })

  it("берёт порядок детей из отдельного блока ОсноваФормы", () => {
    const address = `${formAddress}.attributes`
    const children = [{ xmlName: "Attribute", name: "Расширение" }]
    const projected = createBaseFormConfigurationIndexReader({
      base: reader([{ logicalAddress: address }]),
      extension: reader([{ logicalAddress: `${formAddress}.ОсноваФормы.attributes`, children }]),
      formLogicalAddress: formAddress,
      extensionIdentityAddresses: new Set(),
    })
    expect(projected.entity(address)).toEqual({ logicalAddress: address, children })
  })
})

function reader(entities: readonly ConfigurationIndexBlockEntity[]) {
  return createLocalConfigurationIndexReader(new Map([["Форма.yaml", { entities }]]))
}
