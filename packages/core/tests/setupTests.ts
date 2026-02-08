import { beforeEach } from "vitest"
import "~/metadata/commonObjects/exportToEnterprise"
import "~/metadata/commonObjects/exportToPreview"
import "~/metadata/commonObjects/exportToXML"
import "~/metadata/commonObjects/importFromEnterprise"
import "~/metadata/commonObjects/importFromXML"

import "~/metadata/forms/elements/exportToXML"
import "~/metadata/forms/elements/rules"

import "~/metadata/forms/collections/childItems/exportToEnterprise"
import "~/metadata/forms/collections/childItems/exportToPreview"
import "~/metadata/forms/collections/childItems/exportToStructure"
import "~/metadata/forms/collections/childItems/exportToXML"
import "~/metadata/forms/collections/childItems/importFromEnterprise"
import "~/metadata/forms/collections/childItems/importFromStructure"
import "~/metadata/forms/collections/childItems/importFromXML"

import { mockContext } from "./mockContext"

beforeEach(() => {
  mockContext.context = {}
})
