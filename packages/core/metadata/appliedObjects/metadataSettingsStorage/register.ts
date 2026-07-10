import { registerDataPathOwnerKind } from "../../validation/dataPath/registry"
import { MetadataSettingsStorageRules } from "./rules"

registerDataPathOwnerKind({
  kind: "ХранилищеНастроек",
  projectDir: "ХранилищеНастроек",
  rule: MetadataSettingsStorageRules,
})
