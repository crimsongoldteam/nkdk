import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { importChildItemsFromTreeYAMLProperty } from "./treeYAML"

registerTypeRule("GroupChildItems", "importFromYAML", importChildItemsFromTreeYAMLProperty)
registerTypeRule("CommandBarChildItems", "importFromYAML", importChildItemsFromTreeYAMLProperty)
registerTypeRule("TableChildItems", "importFromYAML", importChildItemsFromTreeYAMLProperty)
registerTypeRule("PagesChildItems", "importFromYAML", importChildItemsFromTreeYAMLProperty)
