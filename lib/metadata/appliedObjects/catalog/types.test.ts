import { expect, it } from "vitest"
import typia from "typia"
import { LowercaseKeys, toLowercaseKeys } from "~/lib/helpers/lowercaseKeys"

interface ITest {
  name: string
  codeLength: number
}

type ITestLowercase = LowercaseKeys<ITest>

it("should validate catalog case insensitive", () => {
  const catalog = toLowercaseKeys({
    name: "123",
    codeLength: 12,
  })

  const result = typia.assertEquals<ITestLowercase>(catalog)

  expect(result).toEqual(catalog)
})
