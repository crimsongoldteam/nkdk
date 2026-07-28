import { describe, expect, it } from "vitest"
import { parseArguments } from "./index"

describe("parseArguments", () => {
  it("enables transactional rewrite only with --apply", () => {
    expect(parseArguments(["--xml-root", "/xml", "--output", "/out"])).toMatchObject({ apply: false })
    expect(parseArguments(["--apply", "--xml-root", "/xml", "--output", "/out"])).toMatchObject({
      apply: true,
    })
  })

  it("rejects a duplicate --apply flag", () => {
    expect(() =>
      parseArguments(["--apply", "--xml-root", "/xml", "--output", "/out", "--apply"])
    ).toThrow(/повторно/)
  })
})
