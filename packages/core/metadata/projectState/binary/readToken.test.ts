import { expect, it } from "vitest"
import { buildProjectStateSnapshot } from "./builder"
import {
  claimBinaryProjectStateReadToken,
  createBinaryProjectStateReadToken,
} from "./readToken"

it("передаёт общие буферы без копирования и захватывается один раз", () => {
  const buffers = buildProjectStateSnapshot({ fragments: [], deletions: [] })
  const token = createBinaryProjectStateReadToken(buffers)
  const claimed = claimBinaryProjectStateReadToken(token)

  expect(claimed.strings).toBe(buffers.strings)
  expect(() => claimBinaryProjectStateReadToken(token)).toThrow(/использован|захвачен/iu)
})
