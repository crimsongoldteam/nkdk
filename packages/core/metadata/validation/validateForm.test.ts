import fs, { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import "~/metadata/forms"
import { mockContext } from "~/tests/mockContext"
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
      form: ["Реквизиты:", "  Наименование: Строка", "Элементы:", "  Поле:", "    Вид: ПолеВвода", "    ПутьКДанным: Наименование"],
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
        "      Количество: Число",
        "  Дерево:",
        "    Тип: ДеревоЗначений",
        "    Колонки:",
        "      Пометка: Булево",
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

  it("resolves owner tabular section fields lazily through owner cache", () => {
    const project = createProject({
      owner: [
        "ТабличныеЧасти:",
        "  Товары:",
        "    Реквизиты:",
        "      Количество: Число",
      ],
      form: [
        "Реквизиты:",
        "  Объект: Справочник.Номенклатура",
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
      owner: ["Реквизиты:", "  Артикул: Строка", "  Описание: Строка"],
      form: [
        "Реквизиты:",
        "  Объект: Справочник.Номенклатура",
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
    const ownerCache = createOwnerMetadataCache({ projectDir: project.projectDir, yamlCache: cache, context: mockContext })

    expect(runValidateForm(project, { cache, ownerCache })).toEqual([])
    expect(readFileSync).toHaveBeenCalledWith(join(project.projectDir, "Справочник", "Номенклатура", "Свойства.yaml"), "utf8")
    expect(
      readFileSync.mock.calls.filter(([filePath]) => filePath === join(project.projectDir, "Справочник", "Номенклатура", "Свойства.yaml")),
    ).toHaveLength(1)
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
      'ПутьКДанным "Контрагент.Наименование": промежуточный реквизит "Контрагент" имеет составной тип',
    )
  })

  it("reports Table.dataPath pointing to boolean", () => {
    const project = createProject({
      form: ["Реквизиты:", "  Флаг: Булево", "Элементы:", "  Таблица:", "    Вид: ТаблицаФормы", "    ПутьКДанным: Флаг"],
    })

    expect(messages(runValidateForm(project))).toEqual([
      expect.stringContaining('ПутьКДанным "Флаг"'),
    ])
  })

  it("accepts DynamicList as Table.dataPath and warns for DynamicList fields", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  Список: ДинамическийСписок",
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

    expect(runValidateForm(project)).toEqual([
      expect.objectContaining({
        severity: "warning",
        message: 'ПутьКДанным "Список.Наименование": колонки динамического списка пока не проверяются',
      }),
    ])
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

  it("reports table child DataPath that does not start with parent table dataPath", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  Таблица:",
        "    Тип: ТаблицаЗначений",
        "    Колонки:",
        "      Количество: Число",
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

    expect(messages(runValidateForm(project))).toContain('ПутьКДанным "Количество": путь колонки должен начинаться с "Таблица."')
  })

  it("reports platform Ref segment and suggests YAML name", () => {
    const project = createProject({
      owner: ["Реквизиты:", "  Артикул: Строка"],
      form: [
        "Реквизиты:",
        "  Объект: Справочник.Номенклатура",
        "Элементы:",
        "  Ссылка:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.Ref",
      ],
    })

    expect(messages(runValidateForm(project))).toContain('ПутьКДанным "Объект.Ref": используйте YAML-имя реквизита вместо платформенного "Ref"')
  })

  it("warns for Items.*.CurrentData.* paths", () => {
    const project = createProject({
      form: ["Элементы:", "  Кнопка:", "    Вид: Кнопка", "    Данные: Items.Таблица.CurrentData.Номенклатура"],
    })

    expect(runValidateForm(project)).toEqual([
      expect.objectContaining({
        severity: "warning",
        message: 'ПутьКДанным "Items.Таблица.CurrentData.Номенклатура": CurrentData пока не проверяется',
      }),
    ])
  })

  it("warns for unsupported tilde variant paths", () => {
    const project = createProject({
      form: [
        "Элементы:",
        "  Поле:",
        "    Вид: ПолеВвода",
        "    ПутьКДаннымКартинкиМножественногоЗначения: ~Список.Period~Список.Период",
      ],
    })

    expect(runValidateForm(project)).toEqual([
      expect.objectContaining({
        severity: "warning",
        message: 'ПутьКДанным "~Список.Period~Список.Период": вариантный путь пока не проверяется',
      }),
    ])
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

    expect(runValidateForm(project)).toEqual([
      expect.objectContaining({
        severity: "warning",
        message: 'ПутьКДанным "КомпоновщикНастроекКомпоновкиДанных.Settings.Filter.Items": платформенный источник пока не проверяется',
      }),
    ])
  })

  it("deduplicates owner diagnostics reused by multiple DataPath values", () => {
    const project = createProject({
      form: [
        "Реквизиты:",
        "  Объект: Справочник.Номенклатура",
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

  function createProject(params: { form: string[]; owner?: string[] }): TestProject {
    const projectDir = mkdtempSync(join(tmpdir(), "nakidka-validate-form-"))
    tempDirs.push(projectDir)

    const ownerDir = join(projectDir, "Справочник", "Номенклатура")
    const formDir = join(ownerDir, "Формы", "ФормаЭлемента")
    mkdirSync(formDir, { recursive: true })
    writeFileSync(join(formDir, "Форма.yaml"), `${params.form.join("\n")}\n`)

    if (params.owner !== undefined) {
      writeFileSync(join(ownerDir, "Свойства.yaml"), `${params.owner.join("\n")}\n`)
    }

    return { projectDir, formDir, ownerDir: "Справочник", ownerName: "Номенклатура", formName: "ФормаЭлемента" }
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
  params: Partial<Pick<Parameters<typeof validateForm>[0], "cache" | "ownerCache">> = {},
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
      params.ownerCache ?? createOwnerMetadataCache({ projectDir: project.projectDir, yamlCache: cache, context: mockContext }),
  })
}

function messages(diagnostics: ReturnType<typeof validateForm>): string[] {
  return diagnostics.map((diagnostic) => diagnostic.message)
}
