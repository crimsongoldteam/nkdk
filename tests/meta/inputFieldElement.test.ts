import "reflect-metadata"
import { container } from "tsyringe"
import { describe, it, expect, beforeEach } from "vitest"
import { IInputFieldElementToken } from "@/meta/forms/container/containerConfig"
import { IInputFieldElement } from "@/meta/forms/interfaces"
import "../../src/meta/"

describe("InputFieldElement autoDataPathName integration", () => {
  let element: IInputFieldElement

  beforeEach(() => {
    container.clearInstances()
    element = container.resolve<IInputFieldElement>(IInputFieldElementToken)
  })

  it("should get and set autoDataPathName", () => {
    const testValue = "testAutoPath"
    element.autoDataPathName = testValue

    expect(element.autoDataPathName).toBe(testValue)
  })

  it("should get and set autoDataPathIndex", () => {
    const testIndex = 5
    element.autoDataPathIndex = testIndex

    expect(element.autoDataPathIndex).toBe(testIndex)
  })

  it("should access dataPathName through properties", () => {
    const testValue = "testDataPath"
    element.properties.dataPathName = testValue

    expect(element.properties.dataPathName).toBe(testValue)
  })

  it("should same strategy for element and properties", () => {
    expect(element.dataPathNameStrategy).toBe(element.properties.dataPathNameStrategy)
  })

  it("should create different strategies for different elements", () => {
    const element2 = container.resolve<IInputFieldElement>(IInputFieldElementToken)

    // Но внутри одного элемента стратегии должны совпадать
    expect(element.dataPathNameStrategy).toBe(element.properties.dataPathNameStrategy)
    expect(element2.dataPathNameStrategy).toBe(element2.properties.dataPathNameStrategy)

    // Каждый элемент должен иметь свою стратегию
    expect(element.dataPathNameStrategy).not.toBe(element2.dataPathNameStrategy)
  })
})
