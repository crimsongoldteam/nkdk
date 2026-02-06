import { beforeEach } from "vitest"
import "~/metadata/commonObjects/exportToEnterprise"
import "~/metadata/commonObjects/exportToPreview"
import "~/metadata/commonObjects/exportToXML"
import "~/metadata/commonObjects/importFromEnterprise"
import "~/metadata/commonObjects/importFromXML"

import "~/metadata/forms/elements/exportToEnterprise"
import "~/metadata/forms/elements/exportToPreview"
import "~/metadata/forms/elements/exportToStructure"
import "~/metadata/forms/elements/exportToXML"
import "~/metadata/forms/elements/importFromEnterprise"
import "~/metadata/forms/elements/importFromXML"
import "~/metadata/forms/elements/rules"

import { mockContext } from "./mockContext"

beforeEach(() => {
  mockContext.context = {}
})
