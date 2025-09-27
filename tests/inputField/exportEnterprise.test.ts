import "reflect-metadata"
import { container } from "tsyringe"
import { ContainerFactory } from "@/metadata/forms/elements"
import { beforeEach, expect, it } from "vitest"
import { EnterpriseExporter } from "@/enterprise/exporter"
import { DITokens } from "@/symbols"
import { IInputField } from "@/metadata/forms/elements/inputField/interfaces"
import { I8nText } from "@/metadata/i8n/i8nText"

const mockInput = {
  Тип: "ПолеФормы",
  НаборСвойств: {
    Вид: "ПолеВвода",
    Заголовок: "Поле",
  },
  Значение: "Значение",
}

beforeEach(() => {
  new ContainerFactory().register()
})

it("should export to Enterprise", () => {
  const input = container.resolve<IInputField>(DITokens.InputField.Element)
  input.title = { ru: "Поле" } as I8nText
  input.value = "Значение"

  const result = container.resolve(EnterpriseExporter).export(input)

  expect(result).toEqual(mockInput)
})
