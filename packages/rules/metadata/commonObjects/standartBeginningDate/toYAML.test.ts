import { describe, expect, it } from "vitest"
import { fullStandartBeginningDate, fullStandartBeginningDateYAML } from "./__fixtures__/data"
import { exportStandartBeginningDateToYAML } from "./toYAML"

describe("exportStandartBeginningDateToYAML", () => {
  it("exports full model to YAML", () => {
    expect(exportStandartBeginningDateToYAML(fullStandartBeginningDate)).toEqual(fullStandartBeginningDateYAML)
  })
})
