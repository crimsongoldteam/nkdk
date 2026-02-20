import { beforeEach } from "vitest"
import "~/metadata/commonObjects"

import "~/metadata/forms/elements"

import "~/metadata/forms/commonObjects/index"

import "~/metadata/forms/collections/childItems/exportToPreview"
import "~/metadata/forms/collections/childItems/exportToStructure"
import "~/metadata/forms/collections/childItems/exportToXML"
import "~/metadata/forms/collections/childItems/fromYAML"
import "~/metadata/forms/collections/childItems/importFromStructure"
import "~/metadata/forms/collections/childItems/importFromXML"
import "~/metadata/forms/collections/childItems/toYAML"

import "~/metadata/appliedObjects"

import { mockContext } from "./mockContext"

beforeEach(() => {
  mockContext.context = {}
})
