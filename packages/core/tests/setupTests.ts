import { beforeEach } from "vitest"
import "~/metadata/appliedObjects"
import "~/metadata/commonObjects"
import "~/metadata/forms/commonObjects/index"
import "~/metadata/forms/elements"
import "~/metadata/systemEnumerations"

import { mockContext } from "./mockContext"

beforeEach(() => {
  mockContext.context = {}
})
