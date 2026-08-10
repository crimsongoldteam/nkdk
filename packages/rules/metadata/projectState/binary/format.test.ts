import { expect, it } from "vitest"
import {
  PROJECT_STATE_FORMAT_VERSION,
  decodeProjectStateHeader,
  encodeProjectStateHeader,
} from "./format"

it("восстанавливает заголовок 0.5.0 и отвергает другую версию", () => {
  const bytes = encodeProjectStateHeader({
    sections: [{ kind: "strings", offset: 128, byteLength: 64, records: 2 }],
    payloadHash: 7n,
  })

  expect(decodeProjectStateHeader(bytes)).toMatchObject({
    version: PROJECT_STATE_FORMAT_VERSION,
    payloadHash: 7n,
    sections: [{ kind: "strings", offset: 128, byteLength: 64, records: 2 }],
  })

  new DataView(bytes.buffer).setUint16(12, 1, true)

  expect(() => decodeProjectStateHeader(bytes)).toThrow(/0\.5\.0/iu)
})

it.each([
  {
    name: "повреждённую сигнатуру",
    corrupt(view: DataView) {
      view.setUint32(0, 0, true)
    },
  },
  {
    name: "неверную длину заголовка",
    corrupt(view: DataView) {
      view.setUint32(24, 31, true)
    },
  },
  {
    name: "неизвестный вид раздела",
    corrupt(view: DataView) {
      view.setUint16(32, 99, true)
    },
  },
  {
    name: "пересекающиеся разделы",
    corrupt(view: DataView) {
      view.setUint32(32 + 16 + 4, 160, true)
    },
  },
])("отвергает $name", ({ corrupt }) => {
  const bytes = encodeProjectStateHeader({
    sections: [
      { kind: "strings", offset: 128, byteLength: 64, records: 2 },
      { kind: "files", offset: 192, byteLength: 32, records: 1 },
    ],
    payloadHash: 7n,
  })

  corrupt(new DataView(bytes.buffer))

  expect(() => decodeProjectStateHeader(bytes)).toThrow()
})

it("не кодирует небезопасные числовые границы", () => {
  expect(() =>
    encodeProjectStateHeader({
      sections: [
        {
          kind: "strings",
          offset: Number.MAX_SAFE_INTEGER + 1,
          byteLength: 64,
          records: 2,
        },
      ],
      payloadHash: 7n,
    }),
  ).toThrow(/цел|границ|раздел/iu)
})
