import { describe, expect, it } from "vitest"
import { validateBaseFormCompatibility } from "./baseFormCompatibility"

describe("совместимость заимствованной формы с текущей формой cf", () => {
  it("принимает одинаковое дерево и дополнительные элементы расширения", () => {
    const base = form({ Группа: element("Группа", { Код: element("ПолеВвода") }) })
    const extension = form({
      Группа: element("Группа", { Код: element("ПолеВвода") }),
      Дополнение: element("ПолеВвода"),
    })

    expect(validateBaseFormCompatibility({ base, extension, extensionFilePath: "/cfe/Форма.yaml" })).toEqual([])
  })

  it("указывает вложенный элемент cf, которого нет в расширении", () => {
    const diagnostics = validateBaseFormCompatibility({
      base: form({ Группа: element("Группа", { НовыйКод: element("ПолеВвода") }) }),
      extension: form({ Группа: element("Группа") }),
      extensionFilePath: "/cfe/Форма.yaml",
    })

    expect(diagnostics).toEqual([expect.objectContaining({
      severity: "error",
      source: "cross-file",
      filePath: "/cfe/Форма.yaml",
      path: "Элементы.Группа.Элементы.НовыйКод",
      message: expect.stringContaining("НовыйКод"),
    })])
  })

  it.each([
    ["Реквизиты", "Реквизит", "реквизит"],
    ["Команды", "Команда", "команда"],
    ["Параметры", "Параметр", "параметр"],
  ])("проверяет категорию %s", (collection, name, label) => {
    const diagnostics = validateBaseFormCompatibility({
      base: { [collection]: { [name]: {} } }, extension: {}, extensionFilePath: "/cfe/БазоваяФорма.yaml",
    })
    expect(diagnostics[0]).toMatchObject({ path: `${collection}.${name}`, message: expect.stringContaining(label) })
  })

  it("диагностирует первое структурное нарушение формы", () => {
    const diagnostics = validateBaseFormCompatibility({
      base: form({ Код: element("ПолеВвода") }),
      extension: form({
        "": element("ПолеВвода"),
        Первая: element("Группа", { Код: element("ПолеВвода") }),
        Вторая: element("Группа", { Код: element("ПолеВвода") }),
      }),
      extensionFilePath: "/cfe/Форма.yaml",
    })

    expect(diagnostics.map(({ message }) => message)).toEqual([
      expect.stringMatching(/имя.*пуст/i),
    ])
  })
})

function form(Элементы: Record<string, unknown>) {
  return { Элементы }
}

function element(Вид: string, Элементы?: Record<string, unknown>) {
  return { Вид, ...(Элементы === undefined ? {} : { Элементы }) }
}
