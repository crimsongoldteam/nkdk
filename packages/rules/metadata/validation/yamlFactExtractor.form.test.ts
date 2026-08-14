import { beforeAll, describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { parseMetadataYaml } from "@nkdk/runtime"
import { resolveValidationProjectFile } from "./projectFiles"
import { createValidationRulesSnapshot } from "./rulesSnapshot"
import { extractValidationYamlFacts } from "./yamlFactExtractor"

let rulesSnapshot: ReturnType<typeof createValidationRulesSnapshot>

beforeAll(() => {
  rulesSnapshot = createValidationRulesSnapshot(mockContext)
})

describe("extractValidationYamlFacts form", () => {
  it("находит одинаковые имена элементов в разных ветвях без учёта регистра", () => {
    const facts = extractFormFacts(
      [
        "Элементы:",
        "  ЛеваяГруппа:",
        "    Вид: Группа",
        "    Элементы:",
        "      Поле:",
        "        Вид: ПолеВвода",
        "  ПраваяГруппа:",
        "    Вид: Группа",
        "    Элементы:",
        "      поле:",
        "        Вид: ПолеВвода",
      ].join("\n")
    )

    expect(facts.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "/Элементы/ПраваяГруппа/Элементы/поле",
          source: "structure",
          severity: "error",
        }),
      ])
    )
  })

  it("резервирует имя отсутствующей расширенной подсказки", () => {
    const facts = extractFormFacts(
      [
        "Элементы:",
        "  Поле:",
        "    Вид: ПолеВвода",
        "  ПолеРасширеннаяПодсказка:",
        "    Вид: ПолеВвода",
      ].join("\n")
    )

    expect(facts.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "/Элементы/ПолеРасширеннаяПодсказка",
          source: "structure",
          severity: "error",
          message: expect.stringContaining('"ПолеРасширеннаяПодсказка"'),
        }),
      ])
    )
  })

  it("рекурсивно резервирует single-имена отсутствующих single-элементов", () => {
    const facts = extractFormFacts(
      [
        "Элементы:",
        "  Таблица:",
        "    Вид: ТаблицаФормы",
        "  ТаблицаСтрокаПоискаРасширеннаяПодсказка:",
        "    Вид: ПолеВвода",
      ].join("\n")
    )

    expect(facts.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "/Элементы/ТаблицаСтрокаПоискаРасширеннаяПодсказка",
          source: "structure",
          severity: "error",
        }),
      ])
    )
  })

  it("не смешивает single-имена поля диаграммы Ганта и его таблицы", () => {
    const facts = extractFormFacts(
      [
        "Элементы:",
        "  ДиаграммаГанта:",
        "    Вид: ПолеДиаграммыГанта",
        "    Таблица: {}",
      ].join("\n")
    )

    expect(facts.diagnostics).toEqual([])
  })

  it("не резервирует single-имена отсутствующей необязательной таблицы поля диаграммы Ганта", () => {
    const facts = extractFormFacts(
      [
        "Элементы:",
        "  ДиаграммаГанта:",
        "    Вид: ПолеДиаграммыГанта",
        "  ДиаграммаГантаТаблицаКонтекстноеМеню:",
        "    Вид: ПолеВвода",
      ].join("\n")
    )

    expect(facts.diagnostics).toEqual([])
  })

  it("строит DataPath checks и equal-name диагностики по YAML формы", () => {
    const projectDir = "/project"
    const filePath = "/project/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml(
        [
          "Реквизиты:",
          "  КакоеТоПоле:",
          "    Тип: Строка",
          "    Заголовок: Какое то поле",
          "Элементы:",
          "  КакоеТоПоле:",
          "    Вид: ПолеВвода",
          "    ПутьКДанным: КакоеТоПоле",
        ].join("\n")
      ),
      rulesSnapshot,
    })

    expect(facts.pendingChecks).toEqual([
      expect.objectContaining({
        kind: "dataPath",
        value: "КакоеТоПоле",
        location: expect.objectContaining({ path: "/Элементы/КакоеТоПоле/ПутьКДанным" }),
      }),
    ])
    expect(facts.diagnostics).toEqual([
      expect.objectContaining({
        source: "structure",
        path: "/Реквизиты/КакоеТоПоле/Заголовок",
        message: expect.stringContaining('Поле "Заголовок" не нужно указывать'),
      }),
    ])
  })

  it("строит DataPath check внутри single-элемента формы", () => {
    const projectDir = "/project"
    const filePath = "/project/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml(
        [
          "Элементы:",
          "  Таблица:",
          "    Вид: ТаблицаФормы",
          "    ПутьКДанным: Объект.Товары",
          "    КонтекстноеМеню:",
          "      Элементы:",
          "        Открыть:",
          "          Вид: КнопкаКоманднойПанели",
          "          Данные: Объект.Товары.LineNumber",
        ].join("\n")
      ),
      rulesSnapshot,
    })

    expect(facts.pendingChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "dataPath",
          value: "Объект.Товары.LineNumber",
          location: expect.objectContaining({
            path: "/Элементы/Таблица/КонтекстноеМеню/Элементы/Открыть/Данные",
          }),
          policy: "formDataPath",
        }),
      ])
    )
  })

  it("публикует вычисляемый путь таблицы основной формы", () => {
    const facts = extractFormFacts(
      [
        "Реквизиты:",
        "  Объект:",
        "    ОсновнойРеквизит: Истина",
        "Элементы:",
        "  Товары:",
        "    Вид: ТаблицаФормы",
      ].join("\n")
    )

    expect(facts.formDataPathIndex?.tabularElementsByName.get("Товары")).toEqual({
      kind: "tabularFormElement",
      dataPath: "Объект.Товары",
    })
  })

  it("не подменяет отсутствующий путь таблицы расширения вычисляемым", () => {
    const projectDir = "/project"
    const filePath = "/project/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")
    const facts = extractValidationYamlFacts({
      file: { ...file, componentPath: "cfe/Расширение", componentDir: "/project/cfe/Расширение" },
      parsed: parseMetadataYaml(
        [
          "Реквизиты:",
          "  Объект:",
          "    ОсновнойРеквизит: Истина",
          "Элементы:",
          "  Товары:",
          "    Вид: ТаблицаФормы",
        ].join("\n")
      ),
      rulesSnapshot,
    })

    expect(facts.formDataPathIndex?.tabularElementsByName.get("Товары")).toEqual({
      kind: "tabularFormElement",
    })
  })

  it("не формирует DataPath checks и diagnostics в fact-only режиме", () => {
    const projectDir = "/project"
    const filePath = "/project/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml(
        [
          "Реквизиты:",
          "  КакоеТоПоле:",
          "    Тип: Строка",
          "    Заголовок: Какое то поле",
          "Элементы:",
          "  КакоеТоПоле:",
          "    Вид: ПолеВвода",
          "    ПутьКДанным: КакоеТоПоле",
        ].join("\n")
      ),
      rulesSnapshot,
      validationDiagnostics: false,
    })

    expect(facts.pendingChecks).toEqual([])
    expect(facts.diagnostics).toEqual([])
  })

  it("публикует нейтральную структуру формы", () => {
    const facts = extractFormFacts([
      "Реквизиты:",
      "  Объект: {}",
      "Команды:",
      "  Записать: {}",
      "Параметры:",
      "  Режим: {}",
      "Элементы:",
      "  Поле:",
      "    Вид: ПолеВвода",
    ].join("\n"))

    expect(facts.structuredComponents).toEqual([
      {
        componentKind: "element",
        name: "Поле",
        yamlPath: ["Элементы", "Поле"],
        payload: JSON.stringify({
          version: 1,
          primaryDataPath: "missing",
          owner: { kind: "Справочник", name: "Товары" },
        }),
      },
      { componentKind: "attribute", name: "Объект", yamlPath: ["Реквизиты", "Объект"] },
      { componentKind: "command", name: "Записать", yamlPath: ["Команды", "Записать"] },
      { componentKind: "parameter", name: "Режим", yamlPath: ["Параметры", "Режим"] },
    ])
  })

  it("не преобразует зарегистрированный omit при сборе ссылок формы", () => {
    const facts = extractFormFacts([
      "Реквизиты:",
      "  РедактируемыйСписок:",
      "    Тип: СписокЗначений",
      "    ТипЗначения: !xml/absent",
    ].join("\n"))

    expect(facts.diagnostics).toEqual([])
    expect(facts.pendingReferences).toEqual([])
  })
})

function extractFormFacts(yaml: string): ReturnType<typeof extractValidationYamlFacts> {
  const projectDir = "/project"
  const filePath = "/project/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
  const file = resolveValidationProjectFile(projectDir, filePath)
  if (file === undefined) throw new Error("file not resolved")

  return extractValidationYamlFacts({
    file,
    parsed: parseMetadataYaml(yaml),
    rulesSnapshot,
  })
}
