import "reflect-metadata"
import { container } from "tsyringe"
import { describe, it, expect, beforeEach } from "vitest"
import { TYPES } from "@/meta/forms/container/symbols"
import { IInputField } from "@/meta/forms/elements/inputField/interfaces"
import "../../src/meta/"

describe("InputFieldElement autoDataPathName integration", () => {
  let element: IInputField

  beforeEach(() => {
    container.clearInstances()
    element = container.resolve<IInputField>(TYPES.IInputField)
  })

  it("should get and set autoDataPathName", () => {
    const testValue = "testAutoPath"
    element.autoDataPath = testValue

    expect(element.autoDataPath).toBe(testValue)
  })

  it("should get and set autoDataPathIndex", () => {
    const testIndex = 5
    element.autoDataPathIndex = testIndex

    expect(element.autoDataPathIndex).toBe(testIndex)
  })

  it("should access dataPathName through properties", () => {
    const testValue = "testDataPath"
    element.properties.dataPath = testValue

    expect(element.properties.dataPath).toBe(testValue)
  })

  // it("should same strategy for element and properties", () => {
  //   expect(element.dataPathNameStrategy).toBe(element.properties.dataPathNameStrategy)
  // })

  // it("should create different strategies for different elements", () => {
  //   const element2 = container.resolve<IInputFieldElement>(TYPES.IInputFieldElement)

  //   // Но внутри одного элемента стратегии должны совпадать
  //   expect(element.dataPathNameStrategy).toBe(element.properties.dataPathNameStrategy)
  //   expect(element2.dataPathNameStrategy).toBe(element2.properties.dataPathNameStrategy)

  //   // Каждый элемент должен иметь свою стратегию
  //   expect(element.dataPathNameStrategy).not.toBe(element2.dataPathNameStrategy)
  // })
})
