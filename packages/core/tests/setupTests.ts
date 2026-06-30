import { beforeEach } from "vitest"
import "~/metadata/register"
import "~/metadata/appliedObjects"
import "~/metadata/commonObjects"
import "~/metadata/forms/commonObjects/index"
import "~/metadata/forms/clientApplicationForm/register"
import "~/metadata/forms/elements"
import "~/metadata/systemEnumerations"

import { mockContext } from "./mockContext"

beforeEach(() => {
  mockContext.context = {}
})
