import "reflect-metadata"
import { container } from "tsyringe"
import { describe, it, expect, beforeEach } from "vitest"
import { configureFormContainer } from "@/meta/forms/container/containerConfig"
import { IDataPathNameStrategy } from "@/meta/forms/mixins/interfaces"
import { IInputFieldElement } from "@/meta/forms/interfaces"

describe("InputFieldElement autoDataPathName integration", () => {
  let element: IInputFieldElement
  let strategy: IDataPathNameStrategy

  beforeEach(() => {
    container.clearInstances()
    configureFormContainer()

    element = container.resolve<IInputFieldElement>("IInputFieldElement")
    strategy = container.resolve<IDataPathNameStrategy>("IDataPathNameStrategy")
  })

  describe("autoDataPathName delegation", () => {
    it("should delegate autoDataPathName getter to strategy", () => {
      const testValue = "testAutoPath"
      strategy.autoValue = testValue

      expect(element.autoDataPathName).toBe(testValue)
    })

    it("should delegate autoDataPathName setter to strategy", () => {
      const testValue = "testAutoPath"
      element.autoDataPathName = testValue

      expect(strategy.autoValue).toBe(testValue)
    })

    it("should delegate autoDataPathIndex to strategy", () => {
      const testIndex = 5
      element.autoDataPathIndex = testIndex

      expect(strategy.autoValueIndex).toBe(testIndex)
    })
  })

  describe("dataPathName through properties", () => {
    it("should access dataPathName through properties", () => {
      const testValue = "testDataPath"
      element.properties.dataPathName = testValue

      expect(element.properties.dataPathName).toBe(testValue)
    })
  })
})
