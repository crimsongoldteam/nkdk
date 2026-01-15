// import { describe, expect, it } from "vitest"
// import {
//   fullFormGroup,
//   fullFormGroupPartialEnterprise,
//   fullFormGroupTypedEnterprise,
//   minimalFormGroup,
//   minimalFormGroupPartialEnterprise,
// } from "~/tests/fixtures/forms/formGroup/data"
// import { mockСontext } from "~/tests/mockContext"
// import { exportFormGroupPartialToEnterprise, exportFormGroupTypedToEnterprise } from "./exportToEnterprise"

// describe("exportFormGroupToEnterprise", () => {
//   describe("exportFormGroupPartialToEnterprise", () => {
//     it("should export all fields to Enterprise", () => {
//       const result = exportFormGroupPartialToEnterprise(mockСontext, fullFormGroup)

//       expect(result).toEqual(fullFormGroupPartialEnterprise)
//     })

//     it("should export minimal", () => {
//       const result = exportFormGroupPartialToEnterprise(mockСontext, minimalFormGroup)

//       expect(result).toEqual(minimalFormGroupPartialEnterprise)
//     })
//   })

//   describe("exportFormGroupTypedToEnterprise", () => {
//     it("should export all fields to Enterprise", () => {
//       const result = exportFormGroupTypedToEnterprise(mockСontext, fullFormGroup)

//       expect(result).toEqual(fullFormGroupTypedEnterprise)
//     })

//     it("should return undefined when data is undefined", () => {
//       const result = exportFormGroupTypedToEnterprise(mockСontext, undefined)

//       expect(result).toBeUndefined()
//     })
//   })
// })
