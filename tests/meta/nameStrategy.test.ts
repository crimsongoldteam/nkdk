import { describe, it, expect, beforeEach } from "vitest"
import "reflect-metadata"
import { container } from "tsyringe"
import { INameStrategyToken } from "../../src/meta/forms/container/containerConfig"
import { INameStrategy } from "@/meta/forms/mixins/interfaces"
import "../../src/meta"

describe("NameStrategy", () => {
  let strategy: INameStrategy

  beforeEach(() => {
    container.clearInstances()

    strategy = container.resolve<INameStrategy>(INameStrategyToken)
  })

  it("should set and get value", () => {
    expect(container.isRegistered(INameStrategyToken)).toBe(true)
    const testValue = "testName"
    strategy.value = testValue
    expect(strategy.value).toBe(testValue)
  })

  it("should set and get autoValue", () => {
    const testValue = "testName"
    strategy.autoValue = testValue

    expect(strategy.autoValue).toBe(testValue)
    expect(strategy.value).toBe(testValue)
  })

  it("should set and get autoValueIndex", () => {
    const testValue = "testName"
    const testIndex = 1
    strategy.autoValue = testValue
    strategy.autoValueIndex = testIndex

    expect(strategy.autoValue).toBe(testValue)
    expect(strategy.autoValueIndex).toBe(testIndex)
    expect(strategy.value).toBe(testValue + testIndex)
  })

  it("should prioritize value over autoValue", () => {
    const testValue = "testName"
    const testAutoValue = "testAutoName"
    strategy.value = testValue
    strategy.autoValue = testAutoValue

    expect(strategy.value).toBe(testValue)
  })
})
