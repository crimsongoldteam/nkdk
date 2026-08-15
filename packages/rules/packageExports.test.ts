import { expectTypeOf, it } from "vitest"

import type * as PackageExports from "./index"

type PackageExportName = keyof typeof PackageExports

it("exports only metadataRules from the package root", () => {
  expectTypeOf<PackageExportName>().toEqualTypeOf<"metadataRules">()
  expectTypeOf<typeof PackageExports.metadataRules>().toBeObject()
})
