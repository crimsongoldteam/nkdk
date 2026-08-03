import { expect, it } from "vitest"
import { buildProjectStateSnapshot } from "./builder"
import {
  claimBinaryProjectStateReadToken,
  cloneBinaryProjectStateReadToken,
  createBinaryProjectStateReadToken,
} from "./readToken"

it("передаёт общие буферы без копирования и захватывается один раз", () => {
  const buffers = buildProjectStateSnapshot({ fragments: [], deletions: [] })
  const token = createBinaryProjectStateReadToken(buffers)
  const claimed = claimBinaryProjectStateReadToken(token)

  expect(claimed.strings).toBe(buffers.strings)
  expect(() => claimBinaryProjectStateReadToken(token)).toThrow(/использован|захвачен/iu)
})

it("клонирует право однократного чтения без копирования общих буферов", () => {
  const buffers = buildProjectStateSnapshot({ fragments: [], deletions: [] })
  const seed = createBinaryProjectStateReadToken(buffers)
  const first = cloneBinaryProjectStateReadToken(seed)
  const second = cloneBinaryProjectStateReadToken(seed)

  expect(first.claim).not.toBe(second.claim)
  expect(first.buffers).toBe(seed.buffers)
  expect(second.buffers).toBe(seed.buffers)
  expect(claimBinaryProjectStateReadToken(first)).toBe(buffers)
  expect(claimBinaryProjectStateReadToken(second)).toBe(buffers)
  expect(() => claimBinaryProjectStateReadToken(first)).toThrow(/использован|захвачен/iu)
  expect(() => claimBinaryProjectStateReadToken(second)).toThrow(/использован|захвачен/iu)
})
