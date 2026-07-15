import fs, { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import "../forms"
import {
  validateClientApplicationFormFirstPass,
  validateClientApplicationFormSecondPass,
} from "../forms/clientApplicationForm/validate"
import { mockContext } from "../../tests/mockContext"
import { createOwnerMetadataCache } from "./dataPath/ownerCache"
import { createProjectYamlCache } from "./projectYamlCache"
import { validateForm } from "./validateForm"

describe("validateForm", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    vi.restoreAllMocks()
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("accepts a valid path to a form attribute", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  Наименование:",
        "    Тип: Строка",
        "Элементы:",
        "  Поле:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Наименование",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts paths to ValueTable and ValueTree columns", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  Таблица:",
        "    Тип: ТаблицаЗначений",
        "    Колонки:",
        "      Количество:",
        "        Тип: Число",
        "  Дерево:",
        "    Тип: ДеревоЗначений",
        "    Колонки:",
        "      Пометка:",
        "        Тип: Булево",
        "Элементы:",
        "  ПолеТаблицы:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Таблица.Количество",
        "  ПолеДерева:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Дерево.Пометка",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts owner form-only table paths described by additional columns", () => {
    const project = createProject({
      ownerDir: "Отчет",
      ownerName: "АнализТрансляцииПроводок",
      owner: ["{}"],
      form: [
        "Реквизиты:",
        "  Отчет:",
        "    Тип: ОтчетОбъект.АнализТрансляцииПроводок",
        "    ДополнительныеКолонки:",
        "      Отчет.ТабПравилаВычисленияПараметров:",
        "        ПолеБД:",
        "          Тип: Строка",
        "        СпособВычисленияПараметра:",
        "          Тип: Перечисление.СпособыВычисленияПараметровОперандов",
        "Элементы:",
        "  ТабПравилаВычисленияПараметров:",
        "    Вид: ТаблицаФормы",
        "    ПутьКДанным: Отчет.ТабПравилаВычисленияПараметров",
        "    Элементы:",
        "      ПолеБД:",
        "        Вид: ПолеВвода",
        "        ПутьКДанным: Отчет.ТабПравилаВычисленияПараметров.ПолеБД",
        "      СпособВычисленияПараметра:",
        "        Вид: ПолеВвода",
        "        ПутьКДанным: Отчет.ТабПравилаВычисленияПараметров.СпособВычисленияПараметра",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts owner ValueList virtual columns", () => {
    const project = createProject({
      ownerDir: "Отчет",
      ownerName: "АнализСубконто",
      owner: ["Реквизиты:", "  СписокВидовСубконто:", "    Тип: СписокЗначений"],
      form: [
        "Реквизиты:",
        "  Отчет:",
        "    Тип: ОтчетОбъект.АнализСубконто",
        "Элементы:",
        "  ВидСубконто:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Отчет.СписокВидовСубконто.Value",
        "  Картинка:",
        "    Вид: ПолеРисунка",
        "    ПутьКДанным: Отчет.СписокВидовСубконто.Picture",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts picture field border with empty style name", () => {
    const project = createProject({
      form: [
        "Элементы:",
        "  Статус:",
        "    Вид: ПолеРисунка",
        "    Рамка:",
        "      Имя:",
        "      Ширина: 1",
        "      ТипРамки: БезРамки",
        "    ПутьКДанным: Статус",
        "Реквизиты:",
        "  Статус:",
        "    Тип: Число",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts paths through DefinedType metadata", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  ВключитьВДоговор:",
        "    Тип: ОпределяемыйТип.ДоговорКонтрагента",
        "Элементы:",
        "  Номер:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: ВключитьВДоговор.Номер",
      ],
      extraOwners: [
        {
          dir: "ОпределяемыйТип",
          name: "ДоговорКонтрагента",
          yaml: ["Тип: Справочник.ДоговорыКонтрагентов"],
        },
        {
          dir: "Справочник",
          name: "ДоговорыКонтрагентов",
          yaml: ["Реквизиты:", "  Номер:", "    Тип: Строка"],
        },
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts owner paths through applicable common attributes", () => {
    const project = createProject({
      ownerName: "НематериальныеАктивы",
      owner: ["{}"],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: СправочникОбъект.НематериальныеАктивы",
        "Элементы:",
        "  КлассВНА:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.КлассВНА",
      ],
      extraOwners: [
        {
          dir: "ОбщийРеквизит",
          name: "КлассВНА",
          yaml: [
            "Тип: Справочник.КлассыВНА",
            "Состав:",
            "  - Объект: Справочники.НематериальныеАктивы",
            "    Использование: Использовать",
          ],
        },
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("resolves owner tabular section fields lazily through owner cache", () => {
    const project = createProject({
      owner: ["ТабличныеЧасти:", "  Товары:", "    Реквизиты:", "      Количество:", "        Тип: Число"],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Справочник.Номенклатура",
        "Элементы:",
        "  Количество:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.Товары.Количество",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("reuses one owner read for repeated DataPath resolution", () => {
    const project = createProject({
      owner: ["Реквизиты:", "  Артикул:", "    Тип: Строка", "  Описание:", "    Тип: Строка"],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Справочник.Номенклатура",
        "Элементы:",
        "  Артикул:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.Артикул",
        "  Описание:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.Описание",
      ],
    })
    const readFileSync = vi.spyOn(fs, "readFileSync")
    const cache = createProjectYamlCache()
    const ownerCache = createOwnerMetadataCache({
      projectDir: project.projectDir,
      yamlCache: cache,
      context: mockContext,
    })

    expect(runValidateForm(project, { cache, ownerCache })).toEqual([])
    expect(readFileSync).toHaveBeenCalledWith(
      join(project.projectDir, "Справочник", "Номенклатура", "Свойства.yaml"),
      "utf8"
    )
    expect(
      readFileSync.mock.calls.filter(
        ([filePath]) => filePath === join(project.projectDir, "Справочник", "Номенклатура", "Свойства.yaml")
      )
    ).toHaveLength(1)
  })

  it("returns the same diagnostics through form validation passes and the registered wrapper", () => {
    const project = createProject({
      owner: ["Реквизиты:", "  Товар:", "    Тип: Справочник.Номенклатура"],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: СправочникОбъект.Номенклатура",
        "Элементы:",
        "  Поле:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.НетТакогоРеквизита",
      ],
    })
    const cache = createProjectYamlCache()
    const ownerCache = createOwnerMetadataCache({
      projectDir: project.projectDir,
      yamlCache: cache,
      context: mockContext,
    })

    const wrapperDiagnostics = runValidateForm(project, { cache, ownerCache })
    const first = validateClientApplicationFormFirstPass({
      projectDir: project.projectDir,
      formDir: project.formDir,
      formName: project.formName,
      owner: { dir: project.ownerDir, name: project.ownerName },
      cache,
      context: mockContext,
    })
    expect(first.status).toBe("ok")
    if (first.status !== "ok") return

    const passDiagnostics = [
      ...first.diagnostics,
      ...validateClientApplicationFormSecondPass({
        state: first.state,
        ownerCache,
      }),
    ]

    expect(passDiagnostics).toEqual(wrapperDiagnostics)
  })

  it("reports intermediate composite type errors", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  Контрагент:",
        "    Тип:",
        "      - Справочник.Контрагенты",
        "      - Справочник.Партнеры",
        "Элементы:",
        "  Наименование:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Контрагент.Наименование",
      ],
    })

    expect(messages(runValidateForm(project))).toContain(
      'ПутьКДанным "Контрагент.Наименование": промежуточный реквизит "Контрагент" имеет составной тип'
    )
  })

  it("reports Table.dataPath pointing to boolean", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  Флаг:",
        "    Тип: Булево",
        "Элементы:",
        "  Таблица:",
        "    Вид: ТаблицаФормы",
        "    ПутьКДанным: Флаг",
      ],
    })

    expect(messages(runValidateForm(project))).toEqual([expect.stringContaining('ПутьКДанным "Флаг"')])
  })

  it("accepts DynamicList as Table.dataPath and ignores DynamicList fields", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  Список:",
        "    Тип: ДинамическийСписок",
        "Элементы:",
        "  Список:",
        "    Вид: ТаблицаФормы",
        "    ПутьКДанным: Список",
        "    Элементы:",
        "      Наименование:",
        "        Вид: ПолеВвода",
        "        ПутьКДанным: Список.Наименование",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("does not restrict InputField, LabelField, table fields, ColumnGroup header, or multiple-value DataPath terminals", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  Составной:",
        "    Тип:",
        "      - Строка",
        "      - Булево",
        "  Таблица:",
        "    Тип: ТаблицаЗначений",
        "    Колонки:",
        "      Составной:",
        "        Тип:",
        "          - Строка",
        "          - Булево",
        "Элементы:",
        "  Поле:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Составной",
        "    ПутьКДаннымКартинкиМножественногоЗначения: Составной",
        "  Надпись:",
        "    Вид: ПолеНадписи",
        "    ПутьКДанным: Составной",
        "  Таблица:",
        "    Вид: ТаблицаФормы",
        "    ПутьКДанным: Таблица",
        "    Элементы:",
        "      КолонкаВвода:",
        "        Вид: ПолеВвода",
        "        ПутьКДанным: Таблица.Составной",
        "      КолонкаНадписи:",
        "        Вид: ПолеНадписи",
        "        ПутьКДанным: Таблица.Составной",
        "      Группа:",
        "        Вид: ГруппаКолонок",
        "        ПутьКДаннымШапки: Таблица.Составной",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts scalar PictureField data path when values picture is configured", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  ИндексКартинки:",
        "    Тип: Число",
        "Элементы:",
        "  Картинка:",
        "    Вид: ПолеРисунка",
        "    КартинкаЗначений: ОбщаяКартинка.Состояния",
        "    ПутьКДанным: ИндексКартинки",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts boolean PictureField data path when values picture is configured", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  ЕстьОшибки:",
        "    Тип: Булево",
        "Элементы:",
        "  Картинка:",
        "    Вид: ПолеРисунка",
        "    КартинкаЗначений: ОбщаяКартинка.Состояния",
        "    ПутьКДанным: ЕстьОшибки",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts table source PictureField data path when values picture is configured", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  ТаблицаОбъектыЗалога:",
        "    Тип: ТаблицаЗначений",
        "    Колонки:",
        "      ОбъектЗалога:",
        "        Тип: Строка",
        "Элементы:",
        "  СостояниеДокумента:",
        "    Вид: ПолеРисунка",
        "    КартинкаЗначений: ОбщаяКартинка.СостоянияДокумента",
        "    ПутьКДанным: ТаблицаОбъектыЗалога",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("keeps table source PictureField data path invalid without values picture", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  ТаблицаОбъектыЗалога:",
        "    Тип: ТаблицаЗначений",
        "    Колонки:",
        "      ОбъектЗалога:",
        "        Тип: Строка",
        "Элементы:",
        "  СостояниеДокумента:",
        "    Вид: ПолеРисунка",
        "    ПутьКДанным: ТаблицаОбъектыЗалога",
      ],
    })

    expect(runValidateForm(project)).toEqual([
      expect.objectContaining({
        message: expect.stringContaining("конечный тип не подходит"),
      }),
    ])
  })

  it("accepts composite PictureField data path when one terminal kind is compatible", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  Картинка:",
        "    Тип:",
        "      - Картинка",
        "      - Число",
        "Элементы:",
        "  Картинка:",
        "    Вид: ПолеРисунка",
        "    КартинкаЗначений: ОбщаяКартинка.Состояния",
        "    ПутьКДанным: Картинка",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts scalar CheckBoxField data path", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  ИндексВыбора:",
        "    Тип: Число(1, 0)",
        "Элементы:",
        "  Использовать:",
        "    Вид: ПолеФлажок",
        "    ПутьКДанным: ИндексВыбора",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts date CheckBoxField data path", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  СрокПринятия:",
        "    Тип: Дата",
        "Элементы:",
        "  ПринятоВСрок:",
        "    Вид: ПолеФлажок",
        "    ПутьКДанным: СрокПринятия",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts scalar TableCheckBoxField data path", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  Настройки:",
        "    Тип: ТаблицаЗначений",
        "    Колонки:",
        "      Пометка:",
        "        Тип: ПоложительноеЧисло(1, 0)",
        "Элементы:",
        "  Настройки:",
        "    Вид: ТаблицаФормы",
        "    ПутьКДанным: Настройки",
        "    Элементы:",
        "      Пометка:",
        "        Вид: ПолеФлажок",
        "        ПутьКДанным: Настройки.Пометка",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts composite TableCheckBoxField data path when one terminal kind is compatible", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  Настройки:",
        "    Тип: ТаблицаЗначений",
        "    Колонки:",
        "      Пометка:",
        "        Тип:",
        "          - Булево",
        "          - Число(1, 0)",
        "Элементы:",
        "  Настройки:",
        "    Вид: ТаблицаФормы",
        "    ПутьКДанным: Настройки",
        "    Элементы:",
        "      Пометка:",
        "        Вид: ПолеФлажок",
        "        ПутьКДанным: Настройки.Пометка",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts scalar table row picture data path", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  Таблица:",
        "    Тип: ТаблицаЗначений",
        "    Колонки:",
        "      ИндексКартинки:",
        "        Тип: Число",
        "Элементы:",
        "  Таблица:",
        "    Вид: ТаблицаФормы",
        "    ПутьКДанным: Таблица",
        "    ПутьКДаннымКартинкиСтроки: Таблица.ИндексКартинки",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts composite table row picture data path when one terminal kind is compatible", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  Таблица:",
        "    Тип: ТаблицаЗначений",
        "    Колонки:",
        "      ИндексКартинки:",
        "        Тип:",
        "          - Число",
        "          - Перечисление.Состояния",
        "Элементы:",
        "  Таблица:",
        "    Вид: ТаблицаФормы",
        "    ПутьКДанным: Таблица",
        "    ПутьКДаннымКартинкиСтроки: Таблица.ИндексКартинки",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts object table row picture data path", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  Таблица:",
        "    Тип: ТаблицаЗначений",
        "    Колонки:",
        "      Состояние:",
        "        Тип: Перечисление.Состояния",
        "Элементы:",
        "  Таблица:",
        "    Вид: ТаблицаФормы",
        "    ПутьКДанным: Таблица",
        "    КартинкаСтрок: ОбщаяКартинка.Состояния",
        "    ПутьКДаннымКартинкиСтроки: Таблица.Состояние",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("reports table child DataPath that does not start with parent table dataPath", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  Таблица:",
        "    Тип: ТаблицаЗначений",
        "    Колонки:",
        "      Количество:",
        "        Тип: Число",
        "Элементы:",
        "  Таблица:",
        "    Вид: ТаблицаФормы",
        "    ПутьКДанным: Таблица",
        "    Элементы:",
        "      Количество:",
        "        Вид: ПолеВвода",
        "        ПутьКДанным: Количество",
      ],
    })

    expect(messages(runValidateForm(project))).toContain(
      'ПутьКДанным "Количество": путь колонки должен начинаться с "Таблица."'
    )
  })

  it("accepts table child footer data path outside parent table data path", () => {
    const project = createProject({
      ownerDir: "Документ",
      ownerName: "Заказ",
      owner: ["ТабличныеЧасти:", "  Начисления:", "    Реквизиты:", "      НДФЛ:", "        Тип: Число"],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Документ.Заказ",
        "  ИтогНДФЛ:",
        "    Тип: Число",
        "Элементы:",
        "  Начисления:",
        "    Вид: ТаблицаФормы",
        "    ПутьКДанным: Объект.Начисления",
        "    Элементы:",
        "      НДФЛ:",
        "        Вид: ПолеВвода",
        "        ПутьКДанным: Объект.Начисления.НДФЛ",
        "        ПутьКДаннымПодвала: ИтогНДФЛ",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("reports unknown table child footer data path without parent table prefix error", () => {
    const project = createProject({
      ownerDir: "Документ",
      ownerName: "Заказ",
      owner: ["ТабличныеЧасти:", "  Начисления:", "    Реквизиты:", "      НДФЛ:", "        Тип: Число"],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Документ.Заказ",
        "Элементы:",
        "  Начисления:",
        "    Вид: ТаблицаФормы",
        "    ПутьКДанным: Объект.Начисления",
        "    Элементы:",
        "      НДФЛ:",
        "        Вид: ПолеВвода",
        "        ПутьКДанным: Объект.Начисления.НДФЛ",
        "        ПутьКДаннымПодвала: НетТакогоИтога",
      ],
    })

    expect(messages(runValidateForm(project))).toEqual([
      'ПутьКДанным "НетТакогоИтога": неизвестный корень "НетТакогоИтога"',
    ])
  })

  it("accepts document number by YAML standard attribute name", () => {
    const project = createProject({
      ownerDir: "Документ",
      ownerName: "Заказ",
      owner: ["{}"],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Документ.Заказ",
        "Элементы:",
        "  Номер:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.Номер",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts standard YAML names after traversing a reference", () => {
    const project = createProject({
      ownerDir: "Документ",
      ownerName: "Заказ",
      owner: [
        "ТабличныеЧасти:",
        "  Товары:",
        "    Реквизиты:",
        "      Номенклатура:",
        "        Тип: Справочник.Номенклатура",
      ],
      extraOwners: [
        {
          dir: "Справочник",
          name: "Номенклатура",
          yaml: ["{}"],
        },
      ],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Документ.Заказ",
        "Элементы:",
        "  КодНоменклатуры:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.Товары.Номенклатура.Код",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts owner YAML name with type inferred from catalog owners", () => {
    const project = createProject({
      ownerDir: "Справочник",
      ownerName: "ПодарочныеСертификаты",
      owner: ["Владельцы:", "  - Справочник.ВидыПодарочныхСертификатов"],
      extraOwners: [
        {
          dir: "Справочник",
          name: "ВидыПодарочныхСертификатов",
          yaml: ["Реквизиты:", "  Валюта:", "    Тип: Справочник.Валюты"],
        },
      ],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Справочник.ПодарочныеСертификаты",
        "Элементы:",
        "  Валюта:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.Владелец.Валюта",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts document date by YAML standard attribute name", () => {
    const project = createProject({
      ownerDir: "Документ",
      ownerName: "Заказ",
      owner: ["{}"],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Документ.Заказ",
        "Элементы:",
        "  Дата:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.Дата",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts predefined by YAML standard attribute name", () => {
    const project = createProject({
      ownerDir: "Справочник",
      ownerName: "ГруппыАналитик",
      owner: ["{}"],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Справочник.ГруппыАналитик",
        "Элементы:",
        "  Предопределенный:",
        "    Вид: ПолеФлажок",
        "    ПутьКДанным: Объект.Предопределенный",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("rejects internal LineNumber spelling in YAML data paths", () => {
    const project = createProject({
      ownerDir: "Документ",
      ownerName: "Заказ",
      owner: [
        "ТабличныеЧасти:",
        "  Товары:",
        "    Реквизиты:",
        "      Номенклатура:",
        "        Тип: Справочник.Номенклатура",
      ],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Документ.Заказ",
        "Элементы:",
        "  НомерСтроки:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.Товары.LineNumber",
      ],
    })

    expect(messages(runValidateForm(project))).toEqual([
      'ПутьКДанным "Объект.Товары.LineNumber": неизвестная колонка "LineNumber"',
    ])
  })

  it("accepts YAML row number spelling in data paths", () => {
    const project = createProject({
      ownerDir: "Документ",
      ownerName: "Заказ",
      owner: [
        "ТабличныеЧасти:",
        "  Товары:",
        "    Реквизиты:",
        "      Номенклатура:",
        "        Тип: Справочник.Номенклатура",
      ],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Документ.Заказ",
        "Элементы:",
        "  НомерСтроки:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.Товары.НомерСтроки",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts owner tabular section fields from form additional columns", () => {
    const project = createProject({
      ownerDir: "Документ",
      ownerName: "Заказ",
      owner: [
        "ТабличныеЧасти:",
        "  Товары:",
        "    Реквизиты:",
        "      Номенклатура:",
        "        Тип: Справочник.Номенклатура",
      ],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Документ.Заказ",
        "    ДополнительныеКолонки:",
        "      Объект.Товары:",
        "        Артикул:",
        "          Тип: Строка",
        "Элементы:",
        "  Артикул:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.Товары.Артикул",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts indexed row paths for owner tabular sections", () => {
    const project = createProject({
      ownerDir: "Документ",
      ownerName: "Заказ",
      owner: ["ТабличныеЧасти:", "  Товары:", "    Реквизиты:", "      Сумма:", "        Тип: Число"],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Документ.Заказ",
        "Элементы:",
        "  Сумма:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.Товары[0].Сумма",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts indexed nested ValueTable paths from form additional columns", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  Доверенность:",
        "    Тип: ТаблицаЗначений",
        "    Колонки:",
        "      Документ:",
        "        Тип: ТаблицаЗначений",
        "    ДополнительныеКолонки:",
        "      Доверенность.Документ:",
        "        Довер:",
        "          Тип: ТаблицаЗначений",
        "      Доверенность.Документ.Довер:",
        "        СвДов:",
        "          Тип: ТаблицаЗначений",
        "      Доверенность.Документ.Довер.СвДов:",
        "        НомДовер:",
        "          Тип: Строка",
        "Элементы:",
        "  Номер:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Доверенность[0].Документ[0].Довер[0].СвДов[0].НомДовер",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts RowsCount in title data paths", () => {
    const project = createProject({
      ownerDir: "Документ",
      ownerName: "Заказ",
      owner: [
        "ТабличныеЧасти:",
        "  Товары:",
        "    Реквизиты:",
        "      Номенклатура:",
        "        Тип: Справочник.Номенклатура",
      ],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Документ.Заказ",
        "Элементы:",
        "  Группа:",
        "    Вид: Группа",
        "    ПутьКДаннымЗаголовка: Объект.Товары.RowsCount",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts RowsCount for ValueList title data paths", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  СкидкиНаценки:",
        "    Тип: СписокЗначений",
        "Элементы:",
        "  Группа:",
        "    Вид: Группа",
        "    ПутьКДаннымЗаголовка: СкидкиНаценки.RowsCount",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts Total columns in footer data paths", () => {
    const project = createProject({
      ownerDir: "Документ",
      ownerName: "Заказ",
      owner: ["ТабличныеЧасти:", "  Товары:", "    Реквизиты:", "      Сумма:", "        Тип: Число"],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Документ.Заказ",
        "Элементы:",
        "  Товары:",
        "    Вид: ТаблицаФормы",
        "    ПутьКДанным: Объект.Товары",
        "    Элементы:",
        "      Сумма:",
        "        Вид: ПолеВвода",
        "        ПутьКДанным: Объект.Товары.Сумма",
        "        ПутьКДаннымПодвала: Объект.Товары.TotalСумма",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts virtual table columns in regular data paths", () => {
    const project = createProject({
      ownerDir: "Документ",
      ownerName: "Заказ",
      owner: ["ТабличныеЧасти:", "  Товары:", "    Реквизиты:", "      Сумма:", "        Тип: Число"],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Документ.Заказ",
        "Элементы:",
        "  КоличествоСтрок:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.Товары.RowsCount",
        "  Итого:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.Товары.TotalСумма",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts ValueList as a table data source", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  Список:",
        "    Тип: СписокЗначений",
        "Элементы:",
        "  Список:",
        "    Вид: ТаблицаФормы",
        "    ПутьКДанным: Список",
        "    ПутьКДаннымКартинкиСтроки: Список.Picture",
        "    Элементы:",
        "      Значение:",
        "        Вид: ПолеВвода",
        "        ПутьКДанным: Список.Value",
        "      Представление:",
        "        Вид: ПолеВвода",
        "        ПутьКДанным: Список.Presentation",
        "      Пометка:",
        "        Вид: ПолеФлажок",
        "        ПутьКДанным: Список.Check",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts GanttChart as a table data source for GanttChartField table", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  ДиаграммаГанта:",
        "    Тип: ДиаграммаГанта",
        "Элементы:",
        "  ДиаграммаГанта:",
        "    Вид: ПолеДиаграммыГанта",
        "    Таблица:",
        "      ПутьКДанным: ДиаграммаГанта",
        "      Элементы:",
        "        Точка:",
        "          Вид: ПолеНадписи",
        "          ПутьКДанным: ДиаграммаГанта.Point",
        "        Текст:",
        "          Вид: ПолеВвода",
        "          ПутьКДанным: ДиаграммаГанта.Text",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts constants set data paths through constant metadata files", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  НаборКонстант:",
        "    Тип: КонстантыНабор",
        "Элементы:",
        "  ИспользоватьСинхронизациюДанных:",
        "    Вид: ПолеФлажок",
        "    ПутьКДанным: НаборКонстант.КонстантаБулево",
      ],
      extraOwners: [
        {
          dir: "Константа",
          name: "КонстантаБулево",
          yaml: ["Тип: Булево"],
        },
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("skips SettingsComposer data paths without validating platform internals", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  КомпоновщикНастроек:",
        "    Тип: КомпоновщикНастроекКомпоновкиДанных",
        "Элементы:",
        "  Отбор:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: КомпоновщикНастроек.Settings.Filter",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts StandardPeriod platform fields", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  Период:",
        "    Тип: СтандартныйПериод",
        "Элементы:",
        "  Вариант:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Период.Variant",
        "  ДатаНачала:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Период.StartDate",
        "  ДатаОкончания:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Период.EndDate",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts document RegisterRecords data paths through document movements", () => {
    const project = createProject({
      ownerDir: "Документ",
      ownerName: "Заказ",
      owner: ["Движения:", "  - РегистрНакопления.Продажи"],
      extraOwners: [
        {
          dir: "РегистрНакопления",
          name: "Продажи",
          yaml: [
            "Измерения:",
            "  Номенклатура:",
            "    Тип: Справочник.Номенклатура",
            "Ресурсы:",
            "  Количество:",
            "    Тип: Число",
          ],
        },
      ],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Документ.Заказ",
        "Элементы:",
        "  НомерСтроки:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.RegisterRecords.Продажи.НомерСтроки",
        "  Период:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.RegisterRecords.Продажи.Период",
        "  УточнениеПериода:",
        "    Вид: ПолеНадписи",
        "    ПутьКДанным: Объект.RegisterRecords.Продажи.PeriodAdjustment",
        "  Активность:",
        "    Вид: ПолеФлажок",
        "    ПутьКДанным: Объект.RegisterRecords.Продажи.Активность",
        "  Количество:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.RegisterRecords.Продажи.Количество",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts CheckBoxField data path bound to enum object values", () => {
    const project = createProject({
      ownerDir: "Справочник",
      ownerName: "ПравилаСогласования",
      owner: [
        "ТабличныеЧасти:",
        "  Шаги:",
        "    Реквизиты:",
        "      ТребуемаяПодпись:",
        "        Тип: Перечисление.ВидыТребуемойПодписи",
      ],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Справочник.ПравилаСогласования",
        "Элементы:",
        "  ТребуемаяПодпись:",
        "    Вид: ПолеФлажок",
        "    ПутьКДанным: Объект.Шаги.ТребуемаяПодпись",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts accounting RegisterRecords virtual columns", () => {
    const project = createProject({
      ownerDir: "Документ",
      ownerName: "Операция",
      owner: ["Движения:", "  - РегистрБухгалтерии.Хозрасчетный"],
      extraOwners: [
        {
          dir: "РегистрБухгалтерии",
          name: "Хозрасчетный",
          yaml: [
            "ПланСчетов: ChartOfAccounts.Хозрасчетный",
            "Измерения:",
            "  Валюта:",
            "    Тип: Справочник.Валюты",
            "Ресурсы:",
            "  Количество:",
            "    Тип: Число",
          ],
        },
      ],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Документ.Операция",
        "Элементы:",
        "  СчетДт:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.RegisterRecords.Хозрасчетный.AccountDr",
        "  СубконтоДт1:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.RegisterRecords.Хозрасчетный.ExtDimensionDr1",
        "  ВалютаДт:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.RegisterRecords.Хозрасчетный.ВалютаDr",
        "  КоличествоКт:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.RegisterRecords.Хозрасчетный.КоличествоCr",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts form-only RegisterRecordSet columns from form requisites", () => {
    const project = createProject({
      ownerDir: "РегистрСведений",
      ownerName: "Настройки",
      owner: ["{}"],
      form: [
        "Реквизиты:",
        "  НаборЗаписей:",
        "    Тип: РегистрСведенийНаборЗаписей.Настройки",
        "    Колонки:",
        "      ПериодГод:",
        "        Тип: Число",
        "Элементы:",
        "  НаборЗаписей:",
        "    Вид: ТаблицаФормы",
        "    ПутьКДанным: НаборЗаписей",
        "    Элементы:",
        "      ПериодГод:",
        "        Вид: ПолеВвода",
        "        ПутьКДанным: НаборЗаписей.ПериодГод",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts ChartOfAccounts ExtDimensionTypes virtual table paths", () => {
    const project = createProject({
      ownerDir: "ПланСчетов",
      ownerName: "Хозрасчетный",
      owner: [
        "ВидыСубконто: ChartOfCharacteristicTypes.ВидыСубконтоХозрасчетные",
        "ПризнакиУчетаСубконто:",
        "  Валютный:",
        "    Тип: Булево",
      ],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: ПланСчетов.Хозрасчетный",
        "Элементы:",
        "  ВидыСубконто:",
        "    Вид: ТаблицаФормы",
        "    ПутьКДанным: Объект.ExtDimensionTypes",
        "    Элементы:",
        "      ВидСубконто:",
        "        Вид: ПолеВвода",
        "        ПутьКДанным: Объект.ExtDimensionTypes.ExtDimensionType",
        "      ТолькоОбороты:",
        "        Вид: ПолеФлажок",
        "        ПутьКДанным: Объект.ExtDimensionTypes.TurnoversOnly",
        "      Валютный:",
        "        Вид: ПолеФлажок",
        "        ПутьКДанным: Объект.ExtDimensionTypes.Валютный",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts ChartOfAccounts virtual owner fields", () => {
    const project = createProject({
      ownerDir: "ПланСчетов",
      ownerName: "Хозрасчетный",
      owner: ["ПризнакиУчета:", "  Валютный:", "    Тип: Булево"],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: ПланСчетов.Хозрасчетный",
        "Элементы:",
        "  Порядок:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.Order",
        "  Забалансовый:",
        "    Вид: ПолеФлажок",
        "    ПутьКДанным: Объект.OffBalance",
        "  Валютный:",
        "    Вид: ПолеФлажок",
        "    ПутьКДанным: Объект.Валютный",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts ChartOfAccounts object accounting flags", () => {
    const project = createProject({
      ownerDir: "ПланСчетов",
      ownerName: "Хозрасчетный",
      owner: ["ПризнакиУчета:", "  Валютный:", "    Тип: Булево"],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: ПланСчетовОбъект.Хозрасчетный",
        "Элементы:",
        "  Валютный:",
        "    Вид: ПолеФлажок",
        "    ПутьКДанным: Объект.Валютный",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts ChartOfCalculationTypes virtual owner tables", () => {
    const project = createProject({
      ownerDir: "ПланВидовРасчета",
      ownerName: "Начисления",
      owner: ["{}"],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: ПланВидовРасчета.Начисления",
        "Элементы:",
        "  БазовыеВидыРасчета:",
        "    Вид: ТаблицаФормы",
        "    ПутьКДанным: Объект.BaseCalculationTypes",
        "    Элементы:",
        "      ВидРасчета:",
        "        Вид: ПолеВвода",
        "        ПутьКДанным: Объект.BaseCalculationTypes.CalculationType",
        "  ПериодДействияБазовый:",
        "    Вид: ПолеФлажок",
        "    ПутьКДанным: Объект.ActionPeriodIsBasic",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts ChartOfCharacteristicTypes value type YAML data path", () => {
    const project = createProject({
      ownerDir: "ПланВидовХарактеристик",
      ownerName: "ВидыСубконто",
      owner: ["ТипЗначения: Справочник.ЗначенияСвойств"],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: ПланВидовХарактеристик.ВидыСубконто",
        "Элементы:",
        "  ТипЗначения:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.ТипЗначения",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts ExchangePlan sent and received number YAML data paths", () => {
    const project = createProject({
      ownerDir: "ПланОбмена",
      ownerName: "Синхронизация",
      owner: ["{}"],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: ПланОбмена.Синхронизация",
        "Элементы:",
        "  НомерОтправленного:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.НомерОтправленного",
        "  НомерПринятого:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.НомерПринятого",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts ExchangePlan data separation and current node data paths", () => {
    const project = createProject({
      ownerDir: "ПланОбмена",
      ownerName: "Синхронизация",
      owner: ["{}"],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: ПланОбменаОбъект.Синхронизация",
        "Элементы:",
        "  ОбластьДанныхОсновныеДанные:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.ОбластьДанныхОсновныеДанные",
        "  ЭтотУзел:",
        "    Вид: ПолеФлажок",
        "    ПутьКДанным: Объект.ThisNode",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts InformationRegister record data separation data paths", () => {
    const project = createProject({
      ownerDir: "РегистрСведений",
      ownerName: "ВидыПриложений",
      owner: ["{}"],
      form: [
        "Реквизиты:",
        "  Запись:",
        "    Тип: РегистрСведенийМенеджерЗаписи.ВидыПриложений",
        "Элементы:",
        "  ОбластьДанныхВспомогательныеДанные:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Запись.ОбластьДанныхВспомогательныеДанные",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("skips Items.*.CurrentData.* paths without diagnostics", () => {
    const project = createProject({
      form: ["Элементы:", "  Кнопка:", "    Вид: Кнопка", "    Данные: Items.Таблица.CurrentData.Номенклатура"],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("skips tilde variant paths without diagnostics", () => {
    const project = createProject({
      form: [
        "Элементы:",
        "  Поле:",
        "    Вид: ПолеВвода",
        "    ПутьКДаннымКартинкиМножественногоЗначения: ~Список.Period~Список.Период",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("accepts opaque multiple-value data path for extended input fields", () => {
    const project = createProject({
      form: [
        "Элементы:",
        "  Реквизит1:",
        "    Вид: ПолеВвода",
        "    РасширенноеРедактированиеМножественныхЗначений: Истина",
        "    ПутьКДанным: 1/0:796f500f-c364-45d1-bce6-9e7e8e15b664",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("keeps opaque data path invalid without extended multiple-value editing", () => {
    const project = createProject({
      form: [
        "Элементы:",
        "  Реквизит1:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: 1/0:796f500f-c364-45d1-bce6-9e7e8e15b664",
      ],
    })

    expect(messages(runValidateForm(project))).toContain(
      'ПутьКДанным "1/0:796f500f-c364-45d1-bce6-9e7e8e15b664": неизвестный корень "1/0:796f500f-c364-45d1-bce6-9e7e8e15b664"'
    )
  })

  it("validates DataPath values inside singleton element child items", () => {
    const project = createProject({
      form: [
        "Элементы:",
        "  Поле:",
        "    Вид: ПолеВвода",
        "    КонтекстноеМеню:",
        "      Элементы:",
        "        Команда:",
        "          Вид: КнопкаКоманднойПанели",
        "          Данные: Неизвестный",
      ],
    })

    expect(messages(runValidateForm(project))).toContain('ПутьКДанным "Неизвестный": неизвестный корень "Неизвестный"')
  })

  it("does not add Table.dataPath policy errors for known platform sources without resolver target", () => {
    const project = createProject({
      form: [
        "Элементы:",
        "  Таблица:",
        "    Вид: ТаблицаФормы",
        "    ПутьКДанным: КомпоновщикНастроекКомпоновкиДанных.Settings.Filter.Items",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })

  it("deduplicates owner diagnostics reused by multiple DataPath values", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Справочник.Номенклатура",
        "Элементы:",
        "  Артикул:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.Артикул",
        "  Описание:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.Описание",
      ],
    })

    const diagnostics = runValidateForm(project).filter((diagnostic) => diagnostic.source === "cross-file")

    expect(diagnostics).toHaveLength(1)
  })

  it("returns syntax diagnostics and skips import", () => {
    const project = createProject({ form: ["Элементы:", "  Поле: ["] })

    expect(runValidateForm(project)).toEqual([
      expect.objectContaining({
        severity: "error",
        source: "syntax",
      }),
    ])
  })

  function createProject(params: {
    form: string[]
    owner?: string[]
    ownerDir?: string
    ownerName?: string
    extraOwners?: Array<{ dir: string; name: string; yaml: string[] }>
  }): TestProject {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validate-form-"))
    tempDirs.push(projectDir)

    const ownerDirName = params.ownerDir ?? "Справочник"
    const ownerName = params.ownerName ?? "Номенклатура"
    const ownerDir = join(projectDir, ownerDirName, ownerName)
    const formDir = join(ownerDir, "Формы", "ФормаЭлемента")
    mkdirSync(formDir, { recursive: true })
    writeFileSync(join(formDir, "Форма.yaml"), `${params.form.join("\n")}\n`)

    if (params.owner !== undefined) {
      writeFileSync(join(ownerDir, "Свойства.yaml"), `${params.owner.join("\n")}\n`)
    }

    for (const extraOwner of params.extraOwners ?? []) {
      const extraOwnerDir = join(projectDir, extraOwner.dir, extraOwner.name)
      mkdirSync(extraOwnerDir, { recursive: true })
      writeFileSync(join(extraOwnerDir, "Свойства.yaml"), `${extraOwner.yaml.join("\n")}\n`)
    }

    return { projectDir, formDir, ownerDir: ownerDirName, ownerName, formName: "ФормаЭлемента" }
  }
})

interface TestProject {
  projectDir: string
  formDir: string
  ownerDir: string
  ownerName: string
  formName: string
}

function runValidateForm(
  project: TestProject,
  params: Partial<Pick<Parameters<typeof validateForm>[0], "cache" | "ownerCache">> = {}
) {
  const cache = params.cache ?? createProjectYamlCache()
  return validateForm({
    projectDir: project.projectDir,
    formDir: project.formDir,
    formName: project.formName,
    owner: { dir: project.ownerDir, name: project.ownerName },
    cache,
    context: mockContext,
    ownerCache:
      params.ownerCache ??
      createOwnerMetadataCache({ projectDir: project.projectDir, yamlCache: cache, context: mockContext }),
  })
}

function messages(diagnostics: ReturnType<typeof validateForm>): string[] {
  return diagnostics.map((diagnostic) => diagnostic.message)
}
