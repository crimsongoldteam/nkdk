import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { dirname, join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { parseMetadataTargetFromYAML } from "~/metadata/commonObjects/metadataTargets"
import type { ParsedMetadataTarget } from "~/metadata/commonObjects/metadataTargets/types"
import { mockContext } from "~/tests/mockContext"
import { createProjectMetadataResolver } from "./projectMetadataResolver"
import { createProjectYamlCache } from "./projectYamlCache"

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

function valueTarget(value: string): Extract<ParsedMetadataTarget, { kind: "value" }> {
  const parsed = parseMetadataTargetFromYAML({
    value,
    constraint: { kind: "value", valueKinds: ["predefinedValue", "enumValue", "emptyRef"], allowEmptyRef: true },
  })
  if (!parsed.ok) throw new Error(parsed.message)
  return parsed.target as Extract<ParsedMetadataTarget, { kind: "value" }>
}
