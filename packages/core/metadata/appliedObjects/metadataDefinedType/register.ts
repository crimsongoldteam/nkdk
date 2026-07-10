import { registerDataPathOwnerKind } from "../../validation/dataPath/registry"
import { MetadataDefinedTypeRules } from "./rules"

registerDataPathOwnerKind({ kind: "ОпределяемыйТип", projectDir: "ОпределяемыйТип", rule: MetadataDefinedTypeRules })
