import { describe, expect, it } from "vitest"
import "../../../tests/metadataExecutionContext"
import { markXmlAnomalyExportClaim, readXmlAnomalyExportClaim } from "@nkdk/runtime"
import "../../appliedObjects"
import "../../forms"
import {
  compactImportedFormDataPaths,
  materializeInheritedRootFormDataPaths,
  materializeImplicitFormDataPaths,
  prepareFormDataPathContextFromYAML,
  requiresImportedFormDataPathCompaction,
} from "./formDataPathContext"
import { catalogOwnerCache } from "./__tests__/catalogOwnerCache"
import type { ClientApplicationFormYAML } from "./types"
import { resolveDataPathCore } from "../../validation/dataPath/coreResolver"

describe("prepareFormDataPathContextFromYAML", () => {
  it("вычисляет кандидаты обычных элементов, таблиц и колонок", () => {
    const context = prepareFormDataPathContextFromYAML({
      yaml: {
        Реквизиты: {
          Объект: { Тип: "CatalogObject.Товары", ОсновнойРеквизит: "Истина" },
        },
        Элементы: {
          Наименование: { Вид: "ПолеВвода" },
          Неизвестное: { Вид: "ПолеВвода" },
          Таблица: {
            Вид: "ТаблицаФормы",
            Элементы: {
              ТаблицаКолонка: { Вид: "ПолеВвода" },
              ТаблицаНаименование: { Вид: "ПолеВвода" },
              Группа: {
                Вид: "ГруппаКолонок",
                Элементы: {
                  БезПрефикса: { Вид: "ПолеВвода" },
                },
              },
            },
          },
          ЯвнаяТаблица: {
            Вид: "ТаблицаФормы",
            ПутьКДанным: "Объект.Таблица",
            Элементы: {
              ЯвнаяТаблицаКолонка: { Вид: "ПолеВвода" },
            },
          },
        },
      },
      ownerCache: catalogOwnerCache(),
    })

    expect(context.effectiveMainAttribute).toBe("Объект")
    expect(elementCandidates(context)).toMatchObject({
      Наименование: ["Объект.Наименование", "Объект.Description"],
      Неизвестное: [undefined, undefined],
      Таблица: ["Объект.Таблица", "Объект.Таблица"],
      ТаблицаКолонка: ["Объект.Таблица.Колонка", "Объект.Таблица.Колонка"],
      ТаблицаНаименование: ["Объект.Таблица.Наименование", "Объект.Таблица.Description"],
      БезПрефикса: ["Объект.Таблица.БезПрефикса", "Объект.Таблица.БезПрефикса"],
      ЯвнаяТаблица: [undefined, undefined],
      ЯвнаяТаблицаКолонка: ["Объект.Таблица.Колонка", "Объект.Таблица.Колонка"],
    })
    expect(context.elementsByName.get("БезПрефикса")?.tableOwnerName).toBe("Таблица")
  })

  it("использует текущую cf для основного реквизита, borrowed-имён и пути таблицы", () => {
    const currentConfigurationFormYaml = {
      Реквизиты: {
        Объект: { Тип: "CatalogObject.Товары", ОсновнойРеквизит: "Истина" },
      },
      Элементы: {
        Код: { Вид: "ПолеВвода", ПутьКДанным: "Объект.Код" },
        Таблица: { Вид: "ТаблицаФормы" },
      },
    } satisfies ClientApplicationFormYAML
    const yaml = {
      Элементы: {
        Код: { Вид: "ПолеВвода" },
        Таблица: {
          Вид: "ТаблицаФормы",
          Элементы: {
            ТаблицаНоваяКолонка: { Вид: "ПолеВвода" },
          },
        },
        Историческое: { Вид: "ПолеВвода" },
      },
    } satisfies ClientApplicationFormYAML
    const context = prepareFormDataPathContextFromYAML({
      yaml,
      currentConfigurationFormYaml,
      savedBaseFormYaml: {
        Элементы: { Историческое: { Вид: "ПолеВвода", ПутьКДанным: "Старое.Значение" } },
      },
      ownerCache: catalogOwnerCache(),
    })

    expect(context.effectiveMainAttribute).toBe("Объект")
    expect(context.elementsByName.get("Код")).toMatchObject({
      origin: "borrowed",
      present: false,
      currentConfigurationValue: "Объект.Код",
      presentInCurrentConfiguration: true,
    })
    expect(context.elementsByName.get("Таблица")).toMatchObject({ origin: "borrowed" })
    expect(context.elementsByName.get("ТаблицаНоваяКолонка")).toMatchObject({
      origin: "own",
      tableOwnerName: "Таблица",
      candidateYaml: "Объект.Таблица.НоваяКолонка",
      candidateInternal: "Объект.Таблица.НоваяКолонка",
    })
    expect(context.elementsByName.get("Историческое")).toMatchObject({ origin: "borrowed" })

    materializeInheritedRootFormDataPaths({ yaml, context })

    expect(yaml.Элементы.Код).not.toHaveProperty("ПутьКДанным")
  })

  it("материализует путь элемента только из исторической основы через унаследованный реквизит", () => {
    const yaml: ClientApplicationFormYAML = {
      Элементы: { ИсторическоеПоле: { Вид: "ПолеВвода" } },
    }
    const context = prepareFormDataPathContextFromYAML({
      yaml,
      currentConfigurationFormYaml: {
        Реквизиты: {
          Объект: { Тип: "CatalogObject.Товары", ОсновнойРеквизит: "Истина" },
        },
      },
      savedBaseFormYaml: {
        Элементы: { ИсторическоеПоле: { Вид: "ПолеВвода" } },
      },
      ownerCache: catalogOwnerCache(),
    })

    expect(context.elementsByName.get("ИсторическоеПоле")).toMatchObject({
      origin: "borrowed",
      candidateRootOrigin: "inherited",
    })
    expect(context.elementsByName.get("ИсторическоеПоле")?.presentInCurrentConfiguration).toBeUndefined()
    materializeInheritedRootFormDataPaths({ yaml, context })

    expect(yaml.Элементы.ИсторическоеПоле.ПутьКДанным).toBe("Объект.ИсторическоеПоле")
  })

  it.each([
    ["working", { Реквизиты: { Объект: { Тип: "CatalogObject.Товары" } } }],
    ["inherited", {}],
  ] as const)("сохраняет происхождение %s корневого реквизита", (expectedOrigin, yaml) => {
    const context = prepareFormDataPathContextFromYAML({
      yaml,
      currentConfigurationFormYaml: {
        Реквизиты: { Объект: { Тип: "CatalogObject.Товары" } },
      },
      ownerCache: catalogOwnerCache(),
    })

    const resolved = resolveDataPathCore({
      value: "Объект.Код",
      nameMode: "yaml",
      index: context.index,
      ownerCache: catalogOwnerCache(),
    })

    expect(resolved).toMatchObject({
      status: "ok",
      root: { kind: "formAttribute", name: "Объект", origin: expectedOrigin },
      target: { source: { kind: "objectField", name: "Код" } },
    })
  })

  it("не вычисляет кандидат обычного элемента без основного реквизита", () => {
    const context = prepareFormDataPathContextFromYAML({
      yaml: { Элементы: { Поле: { Вид: "ПолеВвода" } } },
      ownerCache: catalogOwnerCache(),
    })

    expect(context.effectiveMainAttribute).toBeUndefined()
    expect(context.elementsByName.get("Поле")?.candidateYaml).toBeUndefined()
  })

  it("удаляет пустой путь собственного элемента без вычислимого кандидата", () => {
    const yaml = {
      Элементы: {
        Поле: { Вид: "ПолеВвода", ПутьКДанным: "" },
      },
    } satisfies ClientApplicationFormYAML
    const context = prepareFormDataPathContextFromYAML({ yaml, ownerCache: catalogOwnerCache() })

    const prepared = materializeImplicitFormDataPaths(yaml, context)

    expect(prepared.Элементы.Поле).not.toHaveProperty("ПутьКДанным")
    expect(yaml.Элементы.Поле).toHaveProperty("ПутьКДанным", "")
  })

  it("удаляет пустые пути таблицы и колонки при пустом пути таблицы", () => {
    const yaml = {
      Элементы: {
        Таблица: {
          Вид: "ТаблицаФормы",
          ПутьКДанным: "",
          Элементы: {
            ТаблицаКолонка: { Вид: "ПолеВвода", ПутьКДанным: "" },
          },
        },
      },
    } satisfies ClientApplicationFormYAML
    const context = prepareFormDataPathContextFromYAML({ yaml, ownerCache: catalogOwnerCache() })

    const prepared = materializeImplicitFormDataPaths(yaml, context)

    expect(prepared.Элементы.Таблица).not.toHaveProperty("ПутьКДанным")
    expect(prepared.Элементы.Таблица.Элементы.ТаблицаКолонка).not.toHaveProperty("ПутьКДанным")
  })

  it("сохраняет export claim при материализации неявного пути", () => {
    const element = { Вид: "ПолеВвода" } as const
    markXmlAnomalyExportClaim(element, "item-1")
    const yaml = {
      Реквизиты: {
        Объект: { Тип: "CatalogObject.Товары", ОсновнойРеквизит: "Истина" },
      },
      Элементы: { Наименование: element },
    } satisfies ClientApplicationFormYAML
    const context = prepareFormDataPathContextFromYAML({ yaml, ownerCache: catalogOwnerCache() })

    const prepared = materializeImplicitFormDataPaths(yaml, context)

    expect(prepared.Элементы.Наименование.ПутьКДанным).toBe("Объект.Наименование")
    expect(readXmlAnomalyExportClaim(prepared.Элементы.Наименование)).toBe("item-1")
    expect(prepared.Элементы.Наименование).not.toBe(element)
    expect(readXmlAnomalyExportClaim(element)).toBe("item-1")
    expect(element).not.toHaveProperty("ПутьКДанным")
  })

  it("уплотняет импортированные пути и различает отсутствующий XML-тег", () => {
    const yaml = {
      Реквизиты: {
        Объект: { Тип: "CatalogObject.Товары", ОсновнойРеквизит: "Истина" },
      },
      Элементы: {
        Наименование: {
          Вид: "ПолеВвода",
          ПутьКДанным: "Объект.Наименование",
          ПутьКДаннымКартинкиМножественногоЗначения: "Объект.Картинка",
        },
        Код: { Вид: "ПолеВвода" },
        Комментарий: { Вид: "ПолеВвода", ПутьКДанным: "Объект.Код" },
      },
    } satisfies ClientApplicationFormYAML
    const context = prepareFormDataPathContextFromYAML({ yaml, ownerCache: catalogOwnerCache() })

    compactImportedFormDataPaths({ yaml, context })

    expect(yaml.Элементы.Наименование).not.toHaveProperty("ПутьКДанным")
    expect(yaml.Элементы.Наименование.ПутьКДаннымКартинкиМножественногоЗначения).toBe("Объект.Картинка")
    expect(yaml.Элементы.Код).toHaveProperty("ПутьКДанным", "")
    expect(yaml.Элементы.Комментарий).toHaveProperty("ПутьКДанным", "Объект.Код")
  })

  it("сохраняет явный путь для владельца без уплотнения импортированного YAML", () => {
    const yaml = {
      Элементы: {
        Поле: { Вид: "ПолеВвода", ПутьКДанным: "Объект.Поле" },
      },
    } satisfies ClientApplicationFormYAML

    compactImportedFormDataPaths({
      yaml,
      context: {
        index: {} as never,
        elementsByName: new Map([[
          "Поле",
          {
            name: "Поле",
            dataPathRule: { type: "DataPath" } as never,
            yamlPath: ["Элементы", "Поле"],
            origin: "own",
            present: true,
            value: "Объект.Поле",
            candidateYaml: "Объект.Поле",
            candidateInternal: "Объект.Поле",
            valueInternal: "Объект.Поле",
            compactImplicitDataPath: false,
          },
        ]]),
      },
    })

    expect(yaml.Элементы.Поле.ПутьКДанным).toBe("Объект.Поле")
  })

  it("сохраняет явный импортированный путь через только унаследованный реквизит", () => {
    const yaml = {
      Элементы: {
        Наименование: { Вид: "ПолеВвода", ПутьКДанным: "Объект.Наименование" },
      },
    } satisfies ClientApplicationFormYAML
    const context = prepareFormDataPathContextFromYAML({
      yaml,
      currentConfigurationFormYaml: {
        Реквизиты: {
          Объект: { Тип: "CatalogObject.Товары", ОсновнойРеквизит: "Истина" },
        },
      },
      ownerCache: catalogOwnerCache(),
    })

    compactImportedFormDataPaths({ yaml, context })

    expect(yaml.Элементы.Наименование.ПутьКДанным).toBe("Объект.Наименование")
  })

  it("материализует отсутствующий путь собственного элемента через унаследованный реквизит", () => {
    const yaml: ClientApplicationFormYAML = {
      Элементы: { Наименование: { Вид: "ПолеВвода" } },
    }
    const context = prepareFormDataPathContextFromYAML({
      yaml,
      currentConfigurationFormYaml: {
        Реквизиты: {
          Объект: { Тип: "CatalogObject.Товары", ОсновнойРеквизит: "Истина" },
        },
      },
      ownerCache: catalogOwnerCache(),
    })

    materializeInheritedRootFormDataPaths({ yaml, context })

    expect(yaml.Элементы.Наименование.ПутьКДанным).toBe("Объект.Наименование")
  })

  it("материализует диагностическую границу, даже если конечный сегмент не разрешается", () => {
    const yaml: ClientApplicationFormYAML = {
      Элементы: { Неизвестное: { Вид: "ПолеВвода" } },
    }
    const context = prepareFormDataPathContextFromYAML({
      yaml,
      currentConfigurationFormYaml: {
        Реквизиты: {
          Объект: { Тип: "CatalogObject.Товары", ОсновнойРеквизит: "Истина" },
        },
      },
      ownerCache: catalogOwnerCache(),
    })

    materializeInheritedRootFormDataPaths({ yaml, context })

    expect(yaml.Элементы.Неизвестное.ПутьКДанным).toBe("Объект.Неизвестное")
  })

  it("запускает финализацию для отсутствующего пути без working-основного реквизита", () => {
    expect(requiresImportedFormDataPathCompaction({
      Элементы: { Наименование: { Вид: "ПолеВвода" } },
    })).toBe(true)
  })

  it.each([
    [undefined, "Объект.НеизвестнаяТаблица.Колонка"],
    ["Объект.ДругаяТаблица", "Объект.ДругаяТаблица.Колонка"],
    ["", undefined],
  ] as const)("материализует неявную колонку неразрешимой таблицы с путём %s", (tablePath, expected) => {
    const yaml: ClientApplicationFormYAML = {
      Элементы: {
        НеизвестнаяТаблица: {
          Вид: "ТаблицаФормы",
          ...(tablePath === undefined ? {} : { ПутьКДанным: tablePath }),
          Элементы: { НеизвестнаяТаблицаКолонка: { Вид: "ПолеВвода" } },
        },
      },
    }
    const context = prepareFormDataPathContextFromYAML({
      yaml,
      currentConfigurationFormYaml: {
        Реквизиты: {
          Объект: { Тип: "CatalogObject.Товары", ОсновнойРеквизит: "Истина" },
        },
      },
      ownerCache: catalogOwnerCache(),
    })

    materializeInheritedRootFormDataPaths({ yaml, context })

    expect(yaml.Элементы.НеизвестнаяТаблица.Элементы.НеизвестнаяТаблицаКолонка.ПутьКДанным).toBe(expected)
  })
})

function elementCandidates(context: ReturnType<typeof prepareFormDataPathContextFromYAML>) {
  return Object.fromEntries(
    [...context.elementsByName].map(([name, state]) => [
      name,
      [state.candidateYaml, state.candidateInternal],
    ])
  )
}
