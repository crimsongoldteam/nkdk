import { registerTypeRule } from "../../ruleRuntime"

registerTypeRule("ChildSubsystemNames", "exportToYAML", (_context, _rule, value) => value)
