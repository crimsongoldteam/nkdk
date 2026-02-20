import { tags } from "typia"
export type MetadataNameYAML = string & tags.Pattern<"^[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*$">
