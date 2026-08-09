import { beforeEach } from "vitest"
import { registerCoreMetadata } from "../metadata/composition/coreMetadata"
import "../metadata/appliedObjects"
import "../metadata/commonObjects"
import "../metadata/forms/commonObjects/index"
import "../metadata/forms/clientApplicationForm/register"
import "../metadata/forms/elements"
import "../metadata/systemEnumerations"

import { mockContext } from "./mockContext"

registerCoreMetadata()

beforeEach(() => {
  mockContext.context = {}
})
