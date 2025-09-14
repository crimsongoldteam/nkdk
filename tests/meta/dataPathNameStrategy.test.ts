import { describe, it, expect, beforeEach } from "vitest"
import "reflect-metadata"
import { container } from "tsyringe"
import { IDataPathNameStrategyToken } from "../../src/meta/forms/container/symbols"
import { IDataPathNameStrategy } from "@/meta/forms/helpers/interfaces"
import "../../src/meta"

describe("DataPathNameStrategy", () => {
  let strategy: IDataPathNameStrategy

  beforeEach(() => {
    container.clearInstances()

    strategy = container.resolve<IDataPathNameStrategy>(IDataPathNameStrategyToken)
  })

  it("should set and get value", () => {
    expect(container.isRegistered(IDataPathNameStrategyToken)).toBe(true)
    const testValue = "testDataPath"
    strategy.value = testValue
    expect(strategy.value).toBe(testValue)
  })

  it("should set and get autoValue", () => {
    const testValue = "testDataPath"
    strategy.autoValue = testValue

    expect(strategy.autoValue).toBe(testValue)
    expect(strategy.value).toBe(testValue)
  })

  it("should set and get autoValueIndex", () => {
    const testValue = "testDataPath"
    const testIndex = 1
    strategy.autoValue = testValue
    strategy.autoValueIndex = testIndex

    expect(strategy.autoValue).toBe(testValue)
    expect(strategy.autoValueIndex).toBe(testIndex)
    expect(strategy.value).toBe(testValue + testIndex)
  })

  it("should prioritize value over autoValue", () => {
    const testValue = "testDataPath"
    const testAutoValue = "testAutoDataPath"
    strategy.value = testValue
    strategy.autoValue = testAutoValue

    expect(strategy.value).toBe(testValue)
  })
})
