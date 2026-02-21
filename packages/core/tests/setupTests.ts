import { beforeEach } from "vitest"
import "~/metadata/commonObjects"

import "~/metadata/forms/elements"

import "~/metadata/forms/commonObjects/index"

import "~/metadata/forms/collections/childItems/exportToStructure"
import "~/metadata/forms/collections/childItems/fromXML"
import "~/metadata/forms/collections/childItems/fromYAML"
import "~/metadata/forms/collections/childItems/importFromStructure"
import "~/metadata/forms/collections/childItems/toEnterprise"
import "~/metadata/forms/collections/childItems/toXML"
import "~/metadata/forms/collections/childItems/toYAML"

import "~/metadata/appliedObjects"

import { mockContext } from "./mockContext"

beforeEach(() => {
  mockContext.context = {}
})
