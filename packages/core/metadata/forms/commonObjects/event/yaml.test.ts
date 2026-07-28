import { describe, expect, it } from "vitest"
import { mockContext } from "../../../../tests/mockContext"
import { eventsRule } from "./types"
import { importEventsFromYAML } from "./fromYAML"
import { exportEventsToYAML } from "./toYAML"

const rule = eventsRule({
  yaml: "События",
  items: {
    onChange: "ПриИзменении",
    startChoice: "НачалоВыбора",
  },
})

describe("события в YAML", () => {
  it("преобразует режимы вызова в русские имена и обратно", () => {
    const model = {
      onChange: {
        Before: "allext_КодПриИзмененииПеред",
        After: "allext_КодПриИзмененииПосле",
      },
      startChoice: {
        Override: "allext_КодНачалоВыбораВместо",
      },
    }
    const yaml = {
      ПриИзменении: {
        Перед: "allext_КодПриИзмененииПеред",
        После: "allext_КодПриИзмененииПосле",
      },
      НачалоВыбора: {
        Вместо: "allext_КодНачалоВыбораВместо",
      },
    }

    expect(exportEventsToYAML(mockContext, rule, model)).toEqual(yaml)
    expect(importEventsFromYAML(mockContext, rule, yaml)).toEqual(model)
  })

  it("сохраняет строковые обработчики и неизвестные имена событий", () => {
    const model = {
      onChange: "КодПриИзменении",
      vendorSpecific: { Before: "КодПеред" },
    }
    const yaml = {
      ПриИзменении: "КодПриИзменении",
      vendorSpecific: { Перед: "КодПеред" },
    }

    expect(exportEventsToYAML(mockContext, rule, model)).toEqual(yaml)
    expect(importEventsFromYAML(mockContext, rule, yaml)).toEqual(model)
  })

  it("отклоняет неизвестный режим вызова с именем события", () => {
    expect(() => exportEventsToYAML(mockContext, rule, { onChange: { Auto: "Обработчик" } })).toThrow(
      "ПриИзменении и режима Auto"
    )
    expect(() => importEventsFromYAML(mockContext, rule, { ПриИзменении: { Auto: "Обработчик" } })).toThrow(
      "ПриИзменении и режима Auto"
    )
  })
})
