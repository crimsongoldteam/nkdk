import { describe, expect, it } from "vitest"
import { configDumpInfoNameFromMigrationPath } from "./nameMapping"

describe("configDumpInfoNameFromMigrationPath", () => {
  it("переводит верхний объект", () => {
    expect(configDumpInfoNameFromMigrationPath("Справочник.Номенклатура")).toBe("Catalog.Номенклатура")
  })

  it("переводит реквизит верхнего объекта", () => {
    expect(configDumpInfoNameFromMigrationPath("Справочник.Номенклатура.Реквизит.Артикул")).toBe(
      "Catalog.Номенклатура.Attribute.Артикул"
    )
  })

  it("переводит реквизит табличной части", () => {
    expect(
      configDumpInfoNameFromMigrationPath("Справочник.Номенклатура.ТабличнаяЧасть.Состав.Реквизит.Количество")
    ).toBe("Catalog.Номенклатура.TabularSection.Состав.Attribute.Количество")
  })

  it("переводит измерение и ресурс регистра", () => {
    expect(configDumpInfoNameFromMigrationPath("РегистрНакопления.Остатки.Измерение.Номенклатура")).toBe(
      "AccumulationRegister.Остатки.Dimension.Номенклатура"
    )
    expect(configDumpInfoNameFromMigrationPath("РегистрНакопления.Остатки.Ресурс.Количество")).toBe(
      "AccumulationRegister.Остатки.Resource.Количество"
    )
  })

  it("переводит рекурсивно вложенную подсистему", () => {
    expect(
      configDumpInfoNameFromMigrationPath(
        "Подсистема.ПодсистемаВсеСвойства.Подсистема.ПодчиненнаяПодсистема"
      )
    ).toBe("Subsystem.ПодсистемаВсеСвойства.Subsystem.ПодчиненнаяПодсистема")
  })

  it("падает на неподдержанном сегменте", () => {
    expect(() => configDumpInfoNameFromMigrationPath("Справочник.Номенклатура.Форма.ФормаЭлемента")).toThrow(
      'Неподдерживаемый сегмент ConfigDumpInfo "Форма"'
    )
  })

  it("падает на неподдержанном корне", () => {
    expect(() => configDumpInfoNameFromMigrationPath("НеизвестныйТип.Номенклатура")).toThrow(
      'Неподдерживаемый корневой путь ConfigDumpInfo "НеизвестныйТип.Номенклатура"'
    )
  })

  it("падает на нечётном хвосте пути", () => {
    expect(() => configDumpInfoNameFromMigrationPath("Справочник.Номенклатура.Реквизит")).toThrow(
      'Некорректный путь ConfigDumpInfo "Справочник.Номенклатура.Реквизит"'
    )
  })
})
