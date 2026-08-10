import { Type } from "typebox"
import { definePropertyTypeRule } from "../../ruleRuntime"

export const metadataPropertyRule000 = definePropertyTypeRule("MinMaxValue", "exportToJSONSchema", () => Type.Number())
