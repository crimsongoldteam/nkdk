import { describe, expect, it } from "vitest"
import "../../appliedObjects"
import "../../forms"
import { MetadataCatalogRules } from "../../appliedObjects/metadataCatalog/rules"
import type { MetadataItem } from "../../ruleRuntime/property/types"
import { buildObjectFieldIndex } from "../../validation/dataPath/objectFields"
import type {
  OwnerMetadata,
  OwnerMetadataCache,
  OwnerMetadataResult,
} from "../../validation/dataPath/ownerCache"
import { createValidationOwnerFacts } from "../../validation/dataPath/ownerFacts"
import { prepareFormDataPathContextFromYAML } from "./formDataPathContext"
import type { ClientApplicationFormYAML } from "./types"

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
      Группа: [undefined, undefined],
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
    const context = prepareFormDataPathContextFromYAML({
      yaml: {
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
      },
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
    })
    expect(context.elementsByName.get("Таблица")).toMatchObject({ origin: "borrowed" })
    expect(context.elementsByName.get("ТаблицаНоваяКолонка")).toMatchObject({
      origin: "own",
      tableOwnerName: "Таблица",
      candidateYaml: "Объект.Таблица.НоваяКолонка",
      candidateInternal: "Объект.Таблица.НоваяКолонка",
    })
    expect(context.elementsByName.get("Историческое")).toMatchObject({ origin: "borrowed" })
  })

  it("не вычисляет кандидат обычного элемента без основного реквизита", () => {
    const context = prepareFormDataPathContextFromYAML({
      yaml: { Элементы: { Поле: { Вид: "ПолеВвода" } } },
      ownerCache: catalogOwnerCache(),
    })

    expect(context.effectiveMainAttribute).toBeUndefined()
    expect(context.elementsByName.get("Поле")?.candidateYaml).toBeUndefined()
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

function catalogOwnerCache(): OwnerMetadataCache {
  const owner = catalogOwner()
  return {
    listRefs: (kind) => (kind === owner.ref.kind ? [owner.ref] : []),
    get(ref): OwnerMetadataResult {
      return ref.kind === owner.ref.kind && ref.name === owner.ref.name
        ? { status: "ok", owner }
        : {
            status: "not-found",
            diagnostics: [{
              filePath: "/tmp/Свойства.yaml",
              line: 1,
              col: 1,
              message: "Не найден владелец",
              severity: "error",
              source: "cross-file",
            }],
          }
    },
  }
}

function catalogOwner(): OwnerMetadata {
  const ref = { kind: "СправочникОбъект", name: "Товары" }
  const filePath = "/tmp/Справочники/Товары/Свойства.yaml"
  const emptyFieldIndex = { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] }
  const model = {
    itemType: "MetadataCatalog",
    tabularSections: [{
      name: "Таблица",
      attributes: [
        { name: "Колонка", type: { type: ["string"] } },
        { name: "Наименование", type: { type: ["string"] } },
        { name: "БезПрефикса", type: { type: ["string"] } },
        { name: "НоваяКолонка", type: { type: ["string"] } },
      ],
    }],
  } as MetadataItem & Record<string, unknown>
  const facts = createValidationOwnerFacts({
    ref,
    filePath,
    fieldIndex: emptyFieldIndex,
    model,
  })
  const ownerWithoutIndex = {
    ref,
    filePath,
    facts,
    rule: MetadataCatalogRules,
    spec: {
      kind: "catalog",
      dir: "Справочник",
      rule: MetadataCatalogRules,
      exportSchema: () => ({ type: "object" }) as never,
    },
  }
  const fieldIndex = buildObjectFieldIndex(ownerWithoutIndex)
  return { ...ownerWithoutIndex, facts: { ...facts, fieldIndex }, fieldIndex }
}
