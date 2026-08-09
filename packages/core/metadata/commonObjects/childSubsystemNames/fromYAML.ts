import { registerTypeRule } from "../../ruleRuntime"

registerTypeRule("ChildSubsystemNames", "importFromYAML", (_context, _rule, value) => value)
