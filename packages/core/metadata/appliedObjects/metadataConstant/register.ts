import { registerDataPathOwnerKind } from "~/metadata/validation/dataPath/registry"
import { MetadataConstantRules } from "./rules"

registerDataPathOwnerKind({ kind: "Константа", projectDir: "Константа", rule: MetadataConstantRules })
