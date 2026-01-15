// import { describe, expect, it } from "vitest"
// import {
//   fullFormGroup,
//   fullFormGroupPartialEnterprise,
//   fullFormGroupTypedEnterprise,
//   minimalFormGroup,
//   minimalFormGroupPartialEnterprise,
//   minimalFormGroupTypedEnterprise,
// } from "~/tests/fixtures/forms/formGroup/data"
// import { mockСontext } from "~/tests/mockContext"
// import { importFormGroupPartialFromEnterprise, importFormGroupTypedFromEnterprise } from "./importFromEnterprise"

// describe("importFormGroupFromEnterprise", () => {
//   describe("importFormGroupTypedFromEnterprise", () => {
//     it("should return undefined when data is undefined", () => {
//       const result = importFormGroupTypedFromEnterprise(mockСontext, undefined, "ГруппаФормы")

//       expect(result).toBeUndefined()
//     })

//     it("should import all fields from Enterprise", () => {
//       const result = importFormGroupTypedFromEnterprise(mockСontext, fullFormGroupTypedEnterprise, "ГруппаФормы")

//       expect(result).toEqual(fullFormGroup)
//     })

//     it("should import minimal", () => {
//       const result = importFormGroupTypedFromEnterprise(mockСontext, minimalFormGroupTypedEnterprise, "ГруппаФормы")

//       expect(result).toEqual(minimalFormGroup)
//     })
//   })

//   describe("importFormGroupPartialFromEnterprise", () => {
//     it("should return undefined when source is undefined", () => {
//       const result = importFormGroupPartialFromEnterprise(mockСontext, undefined, undefined)

//       expect(result).toBeUndefined()
//     })

//     it("should import all fields from Enterprise", () => {
//       const result = importFormGroupPartialFromEnterprise(mockСontext, fullFormGroup, fullFormGroupPartialEnterprise)

//       expect(result).toEqual(fullFormGroup)
//     })

//     it("should import minimal", () => {
//       const result = importFormGroupPartialFromEnterprise(
//         mockСontext,
//         minimalFormGroup,
//         minimalFormGroupPartialEnterprise
//       )

//       expect(result).toEqual(minimalFormGroup)
//     })
//   })
// })
