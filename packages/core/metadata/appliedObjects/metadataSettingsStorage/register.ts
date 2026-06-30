import { registerDataPathOwnerKind } from "~/metadata/validation/dataPath/registry"
import { MetadataSettingsStorageRules } from "./rules"

registerDataPathOwnerKind({ kind: "ХранилищеНастроек", projectDir: "ХранилищеНастроек", rule: MetadataSettingsStorageRules })
