import { expect, it } from "vitest"
import { createProjectStateFileUpdateBatch } from "../fileUpdate"
import {
  encodeProjectStateFileUpdateBatch,
  openProjectStateFileUpdateBatch,
} from "./contribution"
import { richYamlUpdate } from "./testData"

it("читает сведения файла прямо из переданного ArrayBuffer", () => {
  const encoded = encodeProjectStateFileUpdateBatch(
    createProjectStateFileUpdateBatch([{
      update: richYamlUpdate("cf/Товары.yaml", "cf", "Catalog.Товары"),
      hash: 9n,
    }]),
  )
  const view = openProjectStateFileUpdateBatch(encoded)

  expect(view.fileCount).toBe(1)
  expect(view.projectPath(0)).toBe("cf/Товары.yaml")
  expect(view.hash(0)).toBe(9n)
  expect(view.references(0)).toEqual([{ kind: "object", canonical: "Catalog.Товары" }])
})

it("передаёт владение единственным буфером", () => {
  const encoded = encodeProjectStateFileUpdateBatch(
    createProjectStateFileUpdateBatch([{
      update: richYamlUpdate("cf/Товары.yaml", "cf", "Catalog.Товары"),
      hash: 9n,
    }]),
  )

  const received = structuredClone(encoded, { transfer: [encoded.bytes.buffer] })

  expect(encoded.bytes.byteLength).toBe(0)
  expect(openProjectStateFileUpdateBatch(received).projectPath(0)).toBe("cf/Товары.yaml")
})

it.each([
  ["лишнее поле", () => ({ bytes: new Uint8Array(), extra: true })],
  ["SharedArrayBuffer", () => ({ bytes: new Uint8Array(new SharedArrayBuffer(8)) })],
  ["смещённое представление", () => ({ bytes: new Uint8Array(new ArrayBuffer(9), 1, 8) })],
])("отвергает непереносимую границу: %s", (_name, create) => {
  expect(() => openProjectStateFileUpdateBatch(create() as never)).toThrow()
})
