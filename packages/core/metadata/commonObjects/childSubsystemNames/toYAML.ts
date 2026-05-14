import { registerTypeRule } from "~/metadata/orchestration"

registerTypeRule("ChildSubsystemNames", "exportToYAML", (_context, _rule, value) => value)
