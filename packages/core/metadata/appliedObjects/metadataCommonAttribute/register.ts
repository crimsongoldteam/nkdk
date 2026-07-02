import { registerDataPathOwnerKind } from "../../validation/dataPath/registry"
import { MetadataCommonAttributeRules } from "./rules"

registerDataPathOwnerKind({ kind: "ОбщийРеквизит", projectDir: "ОбщийРеквизит", rule: MetadataCommonAttributeRules })
