import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { dirname, join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { parseMetadataTargetFromYAML } from "~/metadata/commonObjects/metadataTargets"
import type { ParsedMetadataTarget } from "~/metadata/commonObjects/metadataTargets/types"
import { mockContext } from "~/tests/mockContext"
import { createProjectMetadataResolver, createProjectMetadataResolverFromValidationTable } from "./projectMetadataResolver"
import { createProjectYamlCache } from "./projectYamlCache"
import { createValidationObjectTable } from "./projectValidationObjectTable"

describe("ProjectMetadataResolver", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("resolves top-level objects from project YAML", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Контрагенты/Свойства.yaml", "Комментарий: ok")
    const resolver = createResolver(projectDir)

    expect(resolver.resolveObject({ target: objectTarget("Справочник.Контрагенты") })).toMatchObject({
      ok: true,
      filePath: join(projectDir, "Справочник", "Контрагенты", "Свойства.yaml"),
    })
  })

  it("resolves document numerators from their physical YAML directory", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Нумератор/ДенежныеДокументы/Свойства.yaml", "Синоним: Денежные документы")
    const resolver = createResolver(projectDir)

    expect(resolver.resolveObject({ target: objectTarget("НумераторДокументов.ДенежныеДокументы") })).toMatchObject({
      ok: true,
      filePath: join(projectDir, "Нумератор", "ДенежныеДокументы", "Свойства.yaml"),
    })
  })

  it("reports unknown objects through reference diagnostics", () => {
    const projectDir = createProject()
    const resolver = createResolver(projectDir)

    expect(resolver.resolveObject({ target: { kind: "object", root: "Catalog", objectName: "НетТакого" } })).toMatchObject({
      ok: false,
      diagnostics: [
        expect.objectContaining({
          source: "reference",
          severity: "error",
          message: 'Не найден объект "Справочник.НетТакого"',
        }),
      ],
    })
  })

  it("returns needsDependency in partial mode when an object file can be resolved but is not loaded yet", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "{}")
    const resolver = createProjectMetadataResolverFromValidationTable({
      projectDir,
      table: createValidationObjectTable(),
      mode: "partial",
    })

    const result = resolver.resolveObject({
      target: { kind: "object", root: "Catalog", objectName: "Товары" },
    })

    expect(result).toMatchObject({
      ok: false,
      dependency: expect.objectContaining({
        kind: "needsDependency",
        file: expect.objectContaining({ projectPath: "Справочник/Товары/Свойства.yaml" }),
      }),
    })
  })

  it("checks nested object paths instead of only the top-level object", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Подсистема/Администрирование/Свойства.yaml", "Синоним: Администрирование")
    const resolver = createResolver(projectDir)

    expect(resolver.resolveObject({ target: objectTarget("Подсистема.Администрирование.Подсистема.Настройки", true) })).toMatchObject({
      ok: false,
      diagnostics: [
        expect.objectContaining({
          source: "reference",
          message: 'Не найден объект "Подсистема.Администрирование.Подсистема.Настройки"',
        }),
      ],
    })

    writeProjectFile(
      projectDir,
      "Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml",
      "Синоним: Настройки",
    )

    expect(resolver.resolveObject({ target: objectTarget("Подсистема.Администрирование.Подсистема.Настройки", true) })).toMatchObject({
      ok: true,
      filePath: join(projectDir, "Подсистема", "Администрирование", "Подсистемы", "Настройки", "Свойства.yaml"),
    })
  })

  it("resolves fields including standard attributes and tabular-section attributes", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Номенклатура/Свойства.yaml", [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
      "ТабличныеЧасти:",
      "  Товары:",
      "    Реквизиты:",
      "      Количество:",
      "        Тип: Число",
    ])
    const resolver = createResolver(projectDir)

    expect(resolver.resolveMember({ target: memberTarget("Справочник.Номенклатура.СтандартныйРеквизит.Наименование") })).toMatchObject({
      ok: true,
    })

    expect(
      resolver.resolveMember({
        target: memberTarget("Справочник.Номенклатура.ТабличнаяЧасть.Товары.Реквизит.Количество"),
      }),
    ).toMatchObject({ ok: true })
  })

  it("resolves current object members and returns field details", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Документ/АвансовыйОтчет/Свойства.yaml", [
      "Реквизиты:",
      "  Провести:",
      "    Тип: Булево",
      "Формы:",
      "  ФормаДокумента",
    ])
    const resolver = createResolver(projectDir)

    expect(resolver.resolveMember({ target: memberTarget("Документ.АвансовыйОтчет.Форма.ФормаДокумента") })).toMatchObject({
      ok: true,
    })
    expect(resolver.resolveMember({ target: memberTarget("Документ.АвансовыйОтчет.Реквизит.Провести") })).toMatchObject({
      ok: true,
      details: expect.objectContaining({
        typeInfo: expect.objectContaining({ kinds: expect.arrayContaining(["boolean"]) }),
      }),
    })
  })

  it("resolves members for direct YAML owner kinds", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Обработка/ПодборПлановЛимитов/Свойства.yaml", [
      "Реквизиты:",
      "  ВидБюджета:",
      "    Тип: Строка",
    ])
    writeProjectFile(projectDir, "ЖурналДокументов/РегламентныеДокументы/Свойства.yaml", [
      "Формы:",
      "  ФормаСписка",
    ])
    const resolver = createResolver(projectDir)

    expect(
      resolver.resolveMember({
        target: memberTarget("Обработка.ПодборПлановЛимитов.Реквизит.ВидБюджета"),
      }),
    ).toMatchObject({ ok: true })

    expect(
      resolver.resolveMember({
        target: memberTarget("ЖурналДокументов.РегламентныеДокументы.Форма.ФормаСписка"),
      }),
    ).toMatchObject({ ok: true })
  })

  it("resolves members for owner kinds backed by validation project specs", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Отчет/ОтчетыПоСотрудникам/Свойства.yaml", [
      "Реквизиты:",
      "  Организация:",
      "    Тип: Строка",
    ])
    writeProjectFile(projectDir, "РегистрБухгалтерии/Хозрасчетный/Свойства.yaml", [
      "Ресурсы:",
      "  Сумма:",
      "    Тип: Число",
    ])
    writeProjectFile(projectDir, "РегистрРасчета/Начисления/Свойства.yaml", [
      "Ресурсы:",
      "  Результат:",
      "    Тип: Число",
    ])
    writeProjectFile(projectDir, "ПланВидовРасчета/ОсновныеНачисления/Свойства.yaml", [
      "Реквизиты:",
      "  КодРасчета:",
      "    Тип: Строка",
    ])
    writeProjectFile(projectDir, "ПланВидовХарактеристик/ВидыСубконто/Свойства.yaml", [
      "Реквизиты:",
      "  Использовать:",
      "    Тип: Булево",
    ])
    writeProjectFile(projectDir, "БизнесПроцесс/Согласование/Свойства.yaml", [
      "Реквизиты:",
      "  Автор:",
      "    Тип: Строка",
    ])
    writeProjectFile(projectDir, "Задача/ЗадачаИсполнителя/Свойства.yaml", [
      "Реквизиты:",
      "  Важность:",
      "    Тип: Число",
    ])
    const resolver = createResolver(projectDir)

    for (const target of [
      "Отчет.ОтчетыПоСотрудникам.Реквизит.Организация",
      "РегистрБухгалтерии.Хозрасчетный.Ресурс.Сумма",
      "РегистрРасчета.Начисления.Ресурс.Результат",
      "ПланВидовРасчета.ОсновныеНачисления.Реквизит.КодРасчета",
      "ПланВидовХарактеристик.ВидыСубконто.Реквизит.Использовать",
      "БизнесПроцесс.Согласование.Реквизит.Автор",
      "Задача.ЗадачаИсполнителя.Реквизит.Важность",
    ]) {
      expect(resolver.resolveMember({ target: memberTarget(target) }), target).toMatchObject({ ok: true })
    }
  })

  it("resolves local forms from child form files when owner YAML does not contain reference-only form names", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Документ/АвансовыйОтчет/Свойства.yaml", "Реквизиты: {}")
    writeProjectFile(projectDir, "Документ/АвансовыйОтчет/Формы/ФормаДокумента/Форма.yaml", "Реквизиты: {}")
    const resolver = createResolver(projectDir)

    expect(resolver.resolveMember({ target: memberTarget("Документ.АвансовыйОтчет.Форма.ФормаДокумента") })).toMatchObject({
      ok: true,
      filePath: join(projectDir, "Документ", "АвансовыйОтчет", "Формы", "ФормаДокумента", "Форма.yaml"),
      details: { kind: "Form", name: "ФормаДокумента", item: "ФормаДокумента" },
    })
  })

  it("keeps missing local forms as reference diagnostics when the child form file is absent", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Документ/АвансовыйОтчет/Свойства.yaml", "Реквизиты: {}")
    const resolver = createResolver(projectDir)

    expect(resolver.resolveMember({ target: memberTarget("Документ.АвансовыйОтчет.Форма.НетТакойФормы") })).toMatchObject({
      ok: false,
      diagnostics: [
        expect.objectContaining({
          source: "reference",
          message: 'Не найден член "Документ.АвансовыйОтчет.Форма.НетТакойФормы": нет сегмента "НетТакойФормы"',
        }),
      ],
    })
  })

  it("resolves local templates from child template files when owner YAML does not contain reference-only template names", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Отчет/Продажи/Свойства.yaml", "Реквизиты: {}")
    writeProjectFile(projectDir, "Отчет/Продажи/Шаблоны/ОсновнаяСхемаКомпоновкиДанных/Template.xml", "<DataCompositionSchema/>")
    const resolver = createResolver(projectDir)

    expect(resolver.resolveMember({ target: memberTarget("Отчет.Продажи.Макет.ОсновнаяСхемаКомпоновкиДанных") })).toMatchObject({
      ok: true,
      filePath: join(projectDir, "Отчет", "Продажи", "Шаблоны", "ОсновнаяСхемаКомпоновкиДанных", "Template.xml"),
      details: {
        kind: "Template",
        name: "ОсновнаяСхемаКомпоновкиДанных",
        item: "ОсновнаяСхемаКомпоновкиДанных",
      },
    })
  })

  it("keeps missing local templates as reference diagnostics when the child template file is absent", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Отчет/Продажи/Свойства.yaml", "Реквизиты: {}")
    const resolver = createResolver(projectDir)

    expect(resolver.resolveMember({ target: memberTarget("Отчет.Продажи.Макет.НетТакогоМакета") })).toMatchObject({
      ok: false,
      diagnostics: [
        expect.objectContaining({
          source: "reference",
          message: 'Не найден член "Отчет.Продажи.Макет.НетТакогоМакета": нет сегмента "НетТакогоМакета"',
        }),
      ],
    })
  })

  it("resolves external data source functions from inline owner YAML", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "ВнешнийИсточникДанных/Продажи/Свойства.yaml", [
      "Синоним: Продажи",
      "Функции:",
      "  Получить:",
      "    Тип: Строка",
    ])
    const resolver = createResolver(projectDir)

    expect(resolver.resolveObject({ target: objectTarget("ВнешнийИсточникДанных.Продажи.Функция.Получить", true) })).toMatchObject({
      ok: true,
      filePath: join(projectDir, "ВнешнийИсточникДанных", "Продажи", "Свойства.yaml"),
      details: { kind: "Function", name: "Получить", item: "Получить" },
    })
  })

  it("keeps missing external data source functions as reference diagnostics when inline item is absent", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "ВнешнийИсточникДанных/Продажи/Свойства.yaml", "Синоним: Продажи")
    const resolver = createResolver(projectDir)

    expect(resolver.resolveObject({ target: objectTarget("ВнешнийИсточникДанных.Продажи.Функция.НетТакой", true) })).toMatchObject({
      ok: false,
      diagnostics: [
        expect.objectContaining({
          source: "reference",
          message: 'Не найден объект "ВнешнийИсточникДанных.Продажи.Функция.НетТакой"',
        }),
      ],
    })
  })

  it("does not resolve nested external data source function targets from inline owner YAML", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "ВнешнийИсточникДанных/Продажи/Свойства.yaml", [
      "Синоним: Продажи",
      "Функции:",
      "  Получить:",
      "    Тип: Строка",
    ])
    const resolver = createResolver(projectDir)

    expect(
      resolver.resolveObject({ target: objectTarget("ВнешнийИсточникДанных.Продажи.Функция.Получить.Таблица.Таблица1", true) }),
    ).toMatchObject({
      ok: false,
      diagnostics: [
        expect.objectContaining({
          source: "reference",
          message: 'Не найден объект "ВнешнийИсточникДанных.Продажи.Функция.Получить.Таблица.Таблица1"',
        }),
      ],
    })
  })

  it("resolves external data source nested object members from nested YAML files", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "ВнешнийИсточникДанных/Продажи/Свойства.yaml", "Синоним: Продажи")
    writeProjectFile(projectDir, "ВнешнийИсточникДанных/Продажи/Таблицы/Заказы/Свойства.yaml", [
      "Поля:",
      "  Номер:",
      "    Тип: Строка",
      "Команды:",
      "  Открыть:",
      "    Синоним: Открыть",
    ])
    writeProjectFile(projectDir, "ВнешнийИсточникДанных/Продажи/Кубы/Продажи/Свойства.yaml", [
      "Измерения:",
      "  Номенклатура:",
      "    Тип: Строка",
      "Ресурсы:",
      "  Количество:",
      "    Тип: Число",
    ])
    const resolver = createResolver(projectDir)

    for (const target of [
      externalDataSourceMemberTarget("ВнешнийИсточникДанных.Продажи.Таблица.Заказы.Поле.Номер", [
        "ExternalDataSource",
        "Table",
        "Field",
      ]),
      externalDataSourceMemberTarget("ВнешнийИсточникДанных.Продажи.Таблица.Заказы.Команда.Открыть", [
        "ExternalDataSource",
        "Table",
        "Command",
      ]),
      externalDataSourceMemberTarget("ВнешнийИсточникДанных.Продажи.Куб.Продажи.Измерение.Номенклатура", [
        "ExternalDataSource",
        "Cube",
        "Dimension",
      ]),
      externalDataSourceMemberTarget("ВнешнийИсточникДанных.Продажи.Куб.Продажи.Ресурс.Количество", [
        "ExternalDataSource",
        "Cube",
        "Resource",
      ]),
    ]) {
      expect(resolver.resolveMember({ target })).toMatchObject({ ok: true })
    }
  })

  it("keeps missing external data source nested object members as reference diagnostics", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "ВнешнийИсточникДанных/Продажи/Свойства.yaml", "Синоним: Продажи")
    writeProjectFile(projectDir, "ВнешнийИсточникДанных/Продажи/Таблицы/Заказы/Свойства.yaml", "Поля: {}")
    const resolver = createResolver(projectDir)

    expect(
      resolver.resolveMember({
        target: externalDataSourceMemberTarget("ВнешнийИсточникДанных.Продажи.Таблица.Заказы.Поле.НетТакого", [
          "ExternalDataSource",
          "Table",
          "Field",
        ]),
      }),
    ).toMatchObject({
      ok: false,
      diagnostics: [
        expect.objectContaining({
          source: "reference",
          message: 'Не найден член "ВнешнийИсточникДанных.Продажи.Таблица.Заказы.Поле.НетТакого": нет сегмента "НетТакого"',
        }),
      ],
    })
  })

  it("does not resolve nested template targets from child template files", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Отчет/Продажи/Свойства.yaml", "Реквизиты: {}")
    writeProjectFile(projectDir, "Отчет/Продажи/Шаблоны/ОсновнаяСхемаКомпоновкиДанных/Template.xml", "<DataCompositionSchema/>")
    const resolver = createResolver(projectDir)

    expect(
      resolver.resolveMember({
        target: {
          kind: "member",
          root: "Report",
          objectName: "Продажи",
          segments: [
            { kind: "Template", name: "ОсновнаяСхемаКомпоновкиДанных" },
            { kind: "Attribute", name: "Поле" },
          ],
        },
      }),
    ).toMatchObject({
      ok: false,
      diagnostics: [
        expect.objectContaining({
          source: "reference",
          message:
            'Не найден член "Отчет.Продажи.Макет.ОсновнаяСхемаКомпоновкиДанных.Реквизит.Поле": "ОсновнаяСхемаКомпоновкиДанных" не содержит вложенных членов',
        }),
      ],
    })
  })

  it("does not resolve other member kinds from child form files", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Документ/АвансовыйОтчет/Свойства.yaml", "Реквизиты: {}")
    writeProjectFile(projectDir, "Документ/АвансовыйОтчет/Формы/ПечатнаяФорма/Форма.yaml", "Реквизиты: {}")
    const resolver = createResolver(projectDir)

    expect(resolver.resolveMember({ target: memberTarget("Документ.АвансовыйОтчет.Макет.ПечатнаяФорма") })).toMatchObject({
      ok: false,
      diagnostics: [
        expect.objectContaining({
          source: "reference",
          message: 'Не найден член "Документ.АвансовыйОтчет.Макет.ПечатнаяФорма": нет сегмента "ПечатнаяФорма"',
        }),
      ],
    })
  })

  it("applies hasType filter to member fields", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Документ/АвансовыйОтчет/Свойства.yaml", [
      "Реквизиты:",
      "  Провести:",
      "    Тип: Булево",
      "  Комментарий:",
      "    Тип: Строка",
    ])
    const resolver = createResolver(projectDir)

    expect(
      resolver.resolveMember({
        target: memberTarget("Документ.АвансовыйОтчет.Реквизит.Провести"),
        filters: [{ kind: "hasType", type: "boolean" }],
      }),
    ).toMatchObject({ ok: true })

    expect(
      resolver.resolveMember({
        target: memberTarget("Документ.АвансовыйОтчет.Реквизит.Комментарий"),
        filters: [{ kind: "hasType", type: "boolean" }],
      }),
    ).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ message: expect.stringContaining("тип которых содержит Булево") })],
    })
  })

  it("applies directMember filter before hasType to member fields", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Документ/АвансовыйОтчет/Свойства.yaml", [
      "Реквизиты:",
      "  Провести:",
      "    Тип: Булево",
      "ТабличныеЧасти:",
      "  Товары:",
      "    Реквизиты:",
      "      Использовать:",
      "        Тип: Булево",
    ])
    const resolver = createResolver(projectDir)
    const filters = [
      { kind: "directMember" },
      { kind: "hasType", type: "boolean" },
    ] as const

    expect(
      resolver.resolveMember({
        target: memberTarget("Документ.АвансовыйОтчет.Реквизит.Провести"),
        filters,
      }),
    ).toMatchObject({ ok: true })

    expect(
      resolver.resolveMember({
        target: memberTarget("Документ.АвансовыйОтчет.ТабличнаяЧасть.Товары.Реквизит.Использовать"),
        filters,
      }),
    ).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ message: expect.stringContaining("прямые члены текущего объекта") })],
    })
  })

  it("resolves templates, commands and tabular-section attributes as members", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Документ/АвансовыйОтчет/Свойства.yaml", [
      "Команды:",
      "  Печать:",
      "    Синоним: Печать",
      "Макеты:",
      "  ПечатнаяФорма",
      "ТабличныеЧасти:",
      "  Товары:",
      "    Реквизиты:",
      "      Количество:",
      "        Тип: Число",
    ])
    const resolver = createResolver(projectDir)

    expect(resolver.resolveMember({ target: memberTarget("Документ.АвансовыйОтчет.Макет.ПечатнаяФорма") })).toMatchObject({
      ok: true,
    })
    expect(resolver.resolveMember({ target: memberTarget("Документ.АвансовыйОтчет.Команда.Печать") })).toMatchObject({
      ok: true,
    })
    expect(
      resolver.resolveMember({
        target: memberTarget("Документ.АвансовыйОтчет.ТабличнаяЧасть.Товары.Реквизит.Количество"),
      }),
    ).toMatchObject({ ok: true })
  })

  it("resolves chart of accounts accounting flags as members", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "ПланСчетов/Хозрасчетный/Свойства.yaml", [
      "ПризнакиУчета:",
      "  УчетПоНаправлениямДеятельности:",
      "    Синоним: Учет по направлениям деятельности",
      "    Тип: Булево",
    ])
    const resolver = createResolver(projectDir)

    const result = resolver.resolveMember({
      target: memberTarget("ПланСчетов.Хозрасчетный.ПризнакУчета.УчетПоНаправлениямДеятельности"),
    })
    expect(result).toMatchObject({ ok: true })
  })

  it("applies stringIndexedAttribute filter to member fields", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Документ/АвансовыйОтчет/Свойства.yaml", [
      "Реквизиты:",
      "  Комментарий:",
      "    Тип: Строка",
      "ТабличныеЧасти:",
      "  Товары:",
      "    Реквизиты:",
      "      Количество:",
      "        Тип: Число",
    ])
    const resolver = createResolver(projectDir)

    expect(
      resolver.resolveMember({
        target: memberTarget("Документ.АвансовыйОтчет.Реквизит.Комментарий"),
        filters: [{ kind: "stringIndexedAttribute" }],
      }),
    ).toMatchObject({ ok: true })

    expect(
      resolver.resolveMember({
        target: memberTarget("Документ.АвансовыйОтчет.ТабличнаяЧасть.Товары"),
        filters: [{ kind: "stringIndexedAttribute" }],
      }),
    ).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ message: expect.stringContaining("пригодные для ввода по строке") })],
    })
  })

  it("applies stringIndexedAttribute filter after resolving string DefinedType metadata", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Контрагенты/Свойства.yaml", [
      "Реквизиты:",
      "  ИНН:",
      "    Тип: ОпределяемыйТип.ИНН",
    ])
    writeProjectFile(projectDir, "ОпределяемыйТип/ИНН/Свойства.yaml", "Тип: Строка(12)")
    const resolver = createResolver(projectDir)

    expect(
      resolver.resolveMember({
        target: memberTarget("Справочник.Контрагенты.Реквизит.ИНН"),
        filters: [{ kind: "stringIndexedAttribute" }],
      }),
    ).toMatchObject({ ok: true })
  })

  it("keeps stringIndexedAttribute filter errors for object DefinedType metadata", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Контрагенты/Свойства.yaml", [
      "Реквизиты:",
      "  Организация:",
      "    Тип: ОпределяемыйТип.Организация",
    ])
    writeProjectFile(projectDir, "ОпределяемыйТип/Организация/Свойства.yaml", "Тип: Справочник.Организации")
    const resolver = createResolver(projectDir)

    expect(
      resolver.resolveMember({
        target: memberTarget("Справочник.Контрагенты.Реквизит.Организация"),
        filters: [{ kind: "stringIndexedAttribute" }],
      }),
    ).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ message: expect.stringContaining("пригодные для ввода по строке") })],
    })
  })

  it("reports missing DefinedType metadata while applying stringIndexedAttribute filter", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Контрагенты/Свойства.yaml", [
      "Реквизиты:",
      "  ИНН:",
      "    Тип: ОпределяемыйТип.ИНН",
    ])
    const resolver = createResolver(projectDir)

    expect(
      resolver.resolveMember({
        target: memberTarget("Справочник.Контрагенты.Реквизит.ИНН"),
        filters: [{ kind: "stringIndexedAttribute" }],
      }),
    ).toMatchObject({
      ok: false,
      diagnostics: [
        expect.objectContaining({
          source: "cross-file",
          message: expect.stringContaining("Не найден файл владельца ОпределяемыйТип.ИНН"),
        }),
      ],
    })
  })

  it("reports missing field owners as reference diagnostics", () => {
    const projectDir = createProject()
    const resolver = createResolver(projectDir)

    expect(resolver.resolveMember({ target: memberTarget("Справочник.НетТакого.Реквизит.Код") })).toMatchObject({
      ok: false,
      diagnostics: [
        expect.objectContaining({
          source: "reference",
          message: 'Не найден объект "Справочник.НетТакого"',
        }),
      ],
    })
  })

  it("resolves predefined values, enum values and EmptyRef", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/СтавкиНДС/Свойства.yaml", [
      "Предопределенные:",
      "  БезНДС:",
      "    Код: \"000000001\"",
      "    Наименование: Без НДС",
    ])
    writeProjectFile(projectDir, "Перечисление/ВидыДоговоров/Свойства.yaml", [
      "Значения:",
      "  СПоставщиком:",
      "    Синоним: С поставщиком",
    ])
    const resolver = createResolver(projectDir)

    expect(resolver.resolveValue({ target: valueTarget("Справочник.СтавкиНДС.ПустаяСсылка") })).toMatchObject({ ok: true })
    expect(resolver.resolveValue({ target: valueTarget("Справочник.СтавкиНДС.БезНДС") })).toMatchObject({ ok: true })
    expect(resolver.resolveValue({ target: valueTarget("Перечисление.ВидыДоговоров.СПоставщиком") })).toMatchObject({
      ok: true,
    })
  })

  it("checks style item type when expected types are provided", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "ЭлементСтиля/ОсновнойЦвет/Свойства.yaml", ["Тип: Цвет", "Значение:", "  Вид: Цвет", "  Значение: '#112233'"])
    const resolver = createResolver(projectDir)

    expect(resolver.resolveStyleItem({ name: "ОсновнойЦвет", expectedTypes: ["Color"] })).toMatchObject({ ok: true })
    expect(resolver.resolveStyleItem({ name: "ОсновнойЦвет", expectedTypes: ["Font"] })).toMatchObject({
      ok: false,
      diagnostics: [
        expect.objectContaining({
          source: "reference",
          message: 'Элемент стиля "ЭлементСтиля.ОсновнойЦвет" имеет тип "Color", ожидался: Font',
        }),
      ],
    })
  })

  it("checks style item type when object target filters are provided", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "ЭлементСтиля/ОсновнойЦвет/Свойства.yaml", ["Тип: Цвет", "Значение:", "  Вид: Цвет", "  Значение: '#112233'"])
    const resolver = createResolver(projectDir)
    const target = { kind: "object", root: "StyleItem", objectName: "ОсновнойЦвет" } as const

    expect(resolver.resolveObject({ target, filters: [{ kind: "styleItemType", values: ["Color"] }] })).toMatchObject({
      ok: true,
    })
    expect(resolver.resolveObject({ target, filters: [{ kind: "styleItemType", values: ["Font"] }] })).toMatchObject({
      ok: false,
      diagnostics: [
        expect.objectContaining({
          source: "reference",
          message: 'Элемент стиля "ЭлементСтиля.ОсновнойЦвет" имеет тип "Color", ожидался: Font',
        }),
      ],
    })
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-project-resolver-"))
    tempDirs.push(projectDir)
    return projectDir
  }
})

function writeProjectFile(projectDir: string, projectPath: string, lines: string[] | string): void {
  const filePath = join(projectDir, ...projectPath.split("/"))
  mkdirSync(dirname(filePath), { recursive: true })
  const text = Array.isArray(lines) ? lines.join("\n") : lines
  writeFileSync(filePath, `${text.trimEnd()}\n`)
}

function createResolver(projectDir: string) {
  return createProjectMetadataResolver({
    projectDir,
    yamlCache: createProjectYamlCache(),
    context: mockContext,
  })
}

function objectTarget(value: string, allowNested = false): Extract<ParsedMetadataTarget, { kind: "object" }> {
  const parsed = parseMetadataTargetFromYAML({ value, constraint: { kind: "object", allowNested } })
  if (!parsed.ok) throw new Error(parsed.message)
  return parsed.target as Extract<ParsedMetadataTarget, { kind: "object" }>
}

function memberTarget(value: string): Extract<ParsedMetadataTarget, { kind: "member" }> {
  const parsed = parseMetadataTargetFromYAML({ value, constraint: { kind: "member", owner: "explicit" } })
  if (!parsed.ok) throw new Error(parsed.message)
  return parsed.target as Extract<ParsedMetadataTarget, { kind: "member" }>
}

function externalDataSourceMemberTarget(
  value: string,
  allowedPath: readonly ["ExternalDataSource", ...Array<"Table" | "Cube" | "DimensionTable" | "Field" | "Command" | "Dimension" | "Resource">],
): Extract<ParsedMetadataTarget, { kind: "member" }> {
  const parsed = parseMetadataTargetFromYAML({
    value,
    constraint: { kind: "member", owner: "explicit", allowedMemberPaths: [allowedPath] },
  })
  if (!parsed.ok) throw new Error(parsed.message)
  return parsed.target as Extract<ParsedMetadataTarget, { kind: "member" }>
}

function valueTarget(value: string): Extract<ParsedMetadataTarget, { kind: "value" }> {
  const parsed = parseMetadataTargetFromYAML({
    value,
    constraint: { kind: "value", valueKinds: ["predefinedValue", "enumValue", "emptyRef"], allowEmptyRef: true },
  })
  if (!parsed.ok) throw new Error(parsed.message)
  return parsed.target as Extract<ParsedMetadataTarget, { kind: "value" }>
}
