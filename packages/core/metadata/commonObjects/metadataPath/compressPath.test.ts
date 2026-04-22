import { describe, expect, it } from "vitest"
import { compressMetadataFieldPath } from "./compressPath"

describe("compressMetadataFieldPath", () => {
  it("верхнеуровневый реквизит", () => {
    expect(compressMetadataFieldPath("Справочник.X.Реквизит.Y")).toBe("Справочник.X.Y")
  })

  it("стандартный реквизит", () => {
    expect(compressMetadataFieldPath("Справочник.X.СтандартныйРеквизит.Y")).toBe("Справочник.X.Y")
  })

  it("реквизит вложен в табличную часть", () => {
    expect(compressMetadataFieldPath("Справочник.X.ТабличнаяЧасть.Z.Реквизит.W")).toBe(
      "Справочник.X.Z.W"
    )
  })

  it("стандартный реквизит в табличной части", () => {
    expect(
      compressMetadataFieldPath("Справочник.X.ТабличнаяЧасть.Z.СтандартныйРеквизит.НомерСтроки")
    ).toBe("Справочник.X.Z.НомерСтроки")
  })

  it("измерение регистра сведений", () => {
    expect(compressMetadataFieldPath("РегистрСведений.X.Измерение.Y")).toBe("РегистрСведений.X.Y")
  })

  it("ресурс регистра сведений", () => {
    expect(compressMetadataFieldPath("РегистрСведений.X.Ресурс.Y")).toBe("РегистрСведений.X.Y")
  })

  it("уже сжатый путь — без изменений", () => {
    expect(compressMetadataFieldPath("Справочник.X.Y")).toBe("Справочник.X.Y")
  })

  it("неизвестный префикс — без изменений", () => {
    expect(compressMetadataFieldPath("Объект.X.Y")).toBe("Объект.X.Y")
  })

  it("путь длиной 2 — без изменений", () => {
    expect(compressMetadataFieldPath("Справочник.X")).toBe("Справочник.X")
  })

  it("пустая строка", () => {
    expect(compressMetadataFieldPath("")).toBe("")
  })
})
