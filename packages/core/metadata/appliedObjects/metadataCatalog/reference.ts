import { MetadataReferenceTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { MetadataCatalogRules } from "./rules"

export type MetadataCatalogReference = MetadataReferenceTypeByRule<typeof MetadataCatalogRules>
