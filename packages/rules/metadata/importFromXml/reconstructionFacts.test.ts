import { describe, expect, it } from "vitest"
import { createImportReconstructionFactsWriter, openImportReconstructionFacts } from "../projectState/binary/reconstructionFacts"

describe("общие факты восстановления XML", () => {
  it("передаёт только адреса и наличие UUID/идентичности, без содержимого блока", () => {
    const writer = createImportReconstructionFactsWriter()
    writer.append({ targetProjectPath: "Справочник/Товары/Свойства.yaml", entities: [
      { logicalAddress: "Catalog.Товары", uuid: "11111111-1111-4111-8111-111111111111" },
      { logicalAddress: "Catalog.Товары.Form.Основная.Element.Поле", xmlId: "12345" },
      {
        logicalAddress: "Catalog.Товары.Contents",
        get xmlValue(): string { throw new Error("Локальный XML не должен читаться") },
        get children(): never { throw new Error("Локальный состав детей не должен читаться") },
      },
    ] })
    const buffer = writer.finish()
    const view = openImportReconstructionFacts(buffer)
    expect([...view.entities()]).toEqual([
      { logicalAddress: "Catalog.Товары", hasUuid: true, hasIdentity: true },
      { logicalAddress: "Catalog.Товары.Form.Основная.Element.Поле", hasUuid: false, hasIdentity: true },
      { logicalAddress: "Catalog.Товары.Contents", hasUuid: false, hasIdentity: false },
    ])
    expect(new TextDecoder().decode(buffer)).not.toContain("12345")
    expect(new TextDecoder().decode(buffer)).not.toContain("11111111-1111-4111-8111-111111111111")
    expect(new TextDecoder().decode(buffer)).not.toContain("Свойства.yaml")
    expect(() => writer.finish()).toThrow(/закрыт/)
  })

  it("отклоняет усечённую передачу и лишние байты", () => {
    const writer = createImportReconstructionFactsWriter()
    writer.append({ targetProjectPath: "Свойства.yaml", entities: [{ logicalAddress: "Конфигурация", xmlId: "1" }] })
    const buffer = writer.finish()
    for (let length = 0; length < buffer.byteLength; length++) {
      expect(() => openImportReconstructionFacts(buffer.slice(0, length))).toThrow()
    }
    const extra = new Uint8Array(buffer.byteLength + 1)
    extra.set(new Uint8Array(buffer))
    expect(() => openImportReconstructionFacts(extra.buffer)).toThrow()
  })

  it("сохраняет пустой профиль и позволяет читать его повторно", () => {
    const writer = createImportReconstructionFactsWriter()
    const view = openImportReconstructionFacts(writer.finish())
    expect([...view.entities()]).toEqual([])
    expect([...view.entities()]).toEqual([])
  })
})
