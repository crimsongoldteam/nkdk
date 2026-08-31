import { expect, it } from "vitest"
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

it.each([undefined, "{}", "{broken", "{\"version\":1,\"yaml\":[]}"])(
  "не принимает неизвестный payload %s",
  (payload) => {
    expect(parseClientApplicationFormSemanticPayload(payload)).toBeUndefined()
  },
)
