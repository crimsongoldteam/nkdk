import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { importChildItemsFromTreeYAMLProperty } from "./treeYAML"

registerTypeRule("GroupChildItems", "importFromYAML", importChildItemsFromTreeYAMLProperty)
registerTypeRule("CommandBarChildItems", "importFromYAML", importChildItemsFromTreeYAMLProperty)
registerTypeRule("TableChildItems", "importFromYAML", importChildItemsFromTreeYAMLProperty)
registerTypeRule("PagesChildItems", "importFromYAML", importChildItemsFromTreeYAMLProperty)
