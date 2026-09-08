import { expect, it } from "vitest"
import { createXmlAnomalyAnnotations, prepareYAMLDocumentData, explicitYAMLString, markYAMLScalarTag } from "@nkdk/runtime"
import {
  parseClientApplicationFormSemanticPayload,
  serializeClientApplicationFormSemanticPayload,
} from "./formSemanticPayload"

it("сериализует нормализованную смысловую форму", () => {
  const payload = serializeClientApplicationFormSemanticPayload({
    _version: "2.20",
    Элементы: { Поле: { Вид: "ПолеВвода", _id: "7" } },
  })

  expect(JSON.parse(payload)).toEqual({
    version: 1,
    yaml: { Элементы: { Поле: { Вид: "ПолеВвода" } } },
  })
  expect(parseClientApplicationFormSemanticPayload(payload)).toEqual({
    Элементы: { Поле: { Вид: "ПолеВвода" } },
  })
})

it("сохраняет пустые значения словаря так же, как окончательный YAML", () => {
  const yaml = { Элементы: { Поле: { Вид: "ПолеВвода", ПараметрыВыбора: { "Отбор.Ссылка": undefined } } } }
  expect(serializeClientApplicationFormSemanticPayload(yaml)).toBe(
    serializeClientApplicationFormSemanticPayload(prepareYAMLDocumentData(yaml, createXmlAnomalyAnnotations()).data),
  )
})

it("сериализует исходный объект без промежуточной копии", () => {
  const yaml = {
    Элементы: [{ Значение: undefined, _uuid: "uuid" }],
    toJSON() { expect(this).toBe(yaml); return this },
  }
  expect(JSON.parse(serializeClientApplicationFormSemanticPayload(yaml))).toEqual({
    version: 1, yaml: { Элементы: [{ Значение: {} }] },
  })
})

it("сохраняет явную строку и отличает помеченное пустое значение от обычного", () => {
  const yaml = { ЯвнаяСтрока: explicitYAMLString("1"), Пустое: undefined, Помеченное: undefined,
    Массив: [undefined, { _id: "7", Значение: "текст" }], "_xmlns:custom": "urn:custom" }
  markYAMLScalarTag(yaml, "Помеченное", "изменять")
  expect(JSON.parse(serializeClientApplicationFormSemanticPayload(yaml))).toEqual({
    version: 1, yaml: { ЯвнаяСтрока: { value: "1" },
      Пустое: {}, Массив: [null, { Значение: "текст" }] },
  })
})

it.each([undefined, "{}", "{broken", "{\"version\":1,\"yaml\":[]}"])(
  "не принимает неизвестный payload %s",
  (payload) => {
    expect(parseClientApplicationFormSemanticPayload(payload)).toBeUndefined()
  },
)
