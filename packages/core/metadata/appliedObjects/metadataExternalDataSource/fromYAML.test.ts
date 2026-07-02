import { describe, expect, it } from "vitest"
import "../../commonObjects"
import "../../systemEnumerations"
import {
  testExportAppliedObjectToYAML,
  testImportAppliedObjectFromXML,
  testImportAppliedObjectFromYAML,
} from "../../../tests/appliedObject"
import { MetadataExternalDataSourceRules } from "./rules"
import type { MetadataExternalDataSource } from "./types"

const fullYAML = {
  Синоним: "Синоним",
  Комментарий: "Комментарий",
  РежимУправленияБлокировкойДанных: "АвтоматическийИУправляемый",
}

const nestedYAML = {
  Синоним: "Синоним",
  Таблицы: {
    ТаблицаНоменклатура: {
      Синоним: "Номенклатура",
      ИмяВИсточникеДанных: "Catalog_Items",
      Поля: {
        Код: {
          Тип: "Строка(10)",
          ИмяВИсточникеДанных: "Code",
        },
      },
    },
  },
  Кубы: {
    Продажи: {
      Синоним: "Продажи",
      ИмяВИсточникеДанных: "Sales",
      ТаблицыИзмерений: {
        Номенклатура: {
          Синоним: "Номенклатура",
          ИмяВИсточникеДанных: "Dim_Items",
          Поля: {
            Код: {
              Тип: "Строка(10)",
              ИмяВИсточникеДанных: "Code",
            },
          },
        },
      },
      Измерения: {
        Номенклатура: {
          Тип: "Строка(10)",
        },
      },
      Ресурсы: {
        Количество: {
          Тип: "Число(15, 3)",
          ИмяВИсточникеДанных: "Qty",
        },
      },
    },
  },
  Функции: {
    ПолучитьОстаток: {
      Тип: "Число(15, 2)",
      ВыражениеВИсточникеДанных: "Balance()",
    },
  },
}

describe("import MetadataExternalDataSource from YAML", () => {
  it("imports full fixture", () => {
    const expected = testImportAppliedObjectFromXML<MetadataExternalDataSource>({
      rule: MetadataExternalDataSourceRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
    })

    expect(testImportAppliedObjectFromYAML({ rule: MetadataExternalDataSourceRules, yaml: fullYAML })).toEqual({
      ...expected,
      name: undefined,
    })
  })

  it("round-trips full YAML", () => {
    const imported = testImportAppliedObjectFromYAML({ rule: MetadataExternalDataSourceRules, yaml: fullYAML })
    expect(testExportAppliedObjectToYAML({ rule: MetadataExternalDataSourceRules, data: imported })).toEqual(fullYAML)
  })

  it("round-trips nested children YAML", () => {
    const imported = testImportAppliedObjectFromYAML({ rule: MetadataExternalDataSourceRules, yaml: nestedYAML })
    expect(testExportAppliedObjectToYAML({ rule: MetadataExternalDataSourceRules, data: imported })).toEqual(nestedYAML)
  })
})
