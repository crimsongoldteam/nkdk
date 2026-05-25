# Graph Label Consolidation Design

## Problem

The graph currently uses many fine-grained Cypher labels as both semantic type and lookup/index surface:

- form elements are split into labels such as `InputField`, `CommandBarButton`, `TableInputField`, `UsualGroup`, `Page`, and others;
- top-level metadata objects are split into labels such as `MetadataCatalog`, `MetadataDocument`, `MetadataEnumeration`, `MetadataInformationRegister`, and others;
- `GraphNode` is added as a shared technical label so queries can find any non-`File` node by `id`.

This hurts the direct `GRAPH.BULK` path. `GRAPH.BULK` can create one node label per node blob, so our bulk replace creates subject labels first and then runs:

```cypher
MATCH (n) WHERE n.id IS NOT NULL AND NOT n:File SET n:GraphNode
```

On the ERP graph this query is the actual bottleneck: the 10 `GRAPH.BULK` commands complete quickly, while the mass `SET n:GraphNode` does not finish in the measurement window.

## Goal

Move from many fine-grained labels to fewer coarse labels at the graph model level, and remove the need to add `GraphNode` to all subject nodes.

The model returned by `buildGraph` should use coarse labels directly. The graph package should receive and persist the same model; it should not perform hidden label translation only for bulk import.

`GraphNode` should be removed from the new persisted graph model entirely.

## Label Model

Keep:

- `File` for source file nodes.
- `GraphStub` for stub/fallback nodes whose concrete type is unknown.

Replace form element labels with:

- `FormElement`

The original form element type is stored in node props:

```ts
{
  label: "FormElement",
  props: {
    kind: "InputField",
    ...
  }
}
```

Replace top-level metadata object labels with:

- `MetadataObject`

The original metadata object type is stored in node props:

```ts
{
  label: "MetadataObject",
  props: {
    kind: "MetadataCatalog",
    ...
  }
}
```

Do not consolidate in this pass:

- `MetadataAttribute`
- `MetadataTabularSection`
- `MetadataRegisterResource`
- `MetadataRegisterDimension`
- `MetadataRegisterAttribute`
- `MetadataEnumerationValue`
- `FormAttribute`
- `FormCommand`
- `ChoiceParameter`
- `ChoiceParameterLink`
- `StandardAttributeDescription`
- other non-top-level common-object labels unless they are form elements.

`Unknown` remains as a diagnostic label for nodes without item type, unless such nodes are better represented as `GraphStub` because they are true stubs.

## Type Classification

The consolidation belongs in `packages/core`, close to graph model construction.

`walkGraphToFileData` currently derives `label` from `item.itemType`. It should normalize the raw item type before emitting `NodeData`:

- if the raw item type is a form element type, emit `label: "FormElement"` and add `props.kind = rawItemType`;
- if the raw item type is a top-level metadata object type, emit `label: "MetadataObject"` and add `props.kind = rawItemType`;
- otherwise emit the current raw item type as label.

The raw type must not be lost. `props.kind` should be reserved for the original graph type. If a flattened item already produces a `p_kind` or `kind`-like property, it must not overwrite this reserved `kind`.

## GraphNode Removal

`GraphNode` should no longer be the shared label for every subject node and should not appear in newly written graphs.

Immediate graph package changes:

- `createNodes` and `mergeNodes` should stop adding `GraphNode` as a second label to all nodes.
- `replaceGraphBulk` should remove the mass `SET n:GraphNode` query.
- `ensureLabelIndexes` should create indexes for actual labels present in the model, not always force `GraphNode(id)`.
- `createBulkPlan` should use `GraphStub`, not `GraphNode`, for fallback nodes.

Fallback behavior:

- true stub nodes should have `label: "GraphStub"`;
- when a source/target label is known, edge creation should match by that label;
- `GraphStub` fallback should be used only for unknown endpoints.

This means incremental paths keep working for edges where `labelByNodeId` knows the concrete label. For unknown endpoints, stubs remain discoverable through `GraphStub(id)`.

## Query Impact

Queries that previously used specific labels must move to coarse labels plus `kind`.

Examples:

```cypher
MATCH (n:MetadataCatalog {id: $id})
```

becomes:

```cypher
MATCH (n:MetadataObject {id: $id, kind: "MetadataCatalog"})
```

and:

```cypher
MATCH (n:InputField)
```

becomes:

```cypher
MATCH (n:FormElement {kind: "InputField"})
```

Queries that previously used `MATCH (n:GraphNode)` to mean "all subject nodes" should be replaced with explicit coarse labels when possible. There is no single universal non-`File` label after this change.

Queries that specifically need unresolved fallback nodes should use `GraphStub`.

## Expected ERP Effect

The ERP label count should drop substantially:

- all form element labels collapse into `FormElement`;
- top-level metadata object labels collapse into `MetadataObject`;
- subject nodes no longer need the mass `GraphNode` label update.

The biggest performance win should come from removing the post-bulk `SET n:GraphNode` query. Label consolidation may also reduce the number of node groups and indexes, but it can increase blob schema width for `FormElement`; this must be measured.

## Non-Goals

- Do not merge metadata fields/resources/dimensions/attributes in this pass.
- Do not redesign edge kinds.
- Do not remove fallback stubs entirely; rename their label to `GraphStub`.
- Do not add a hidden graph-package-only remapping layer.
- Do not optimize property flattening or remove large form props in this pass.

## Verification

Unit tests:

- `walkGraphToFileData` maps form elements to `FormElement` with `props.kind`.
- `walkGraphToFileData` maps top-level metadata objects to `MetadataObject` with `props.kind`.
- non-target labels remain unchanged.
- stub nodes use `GraphStub`.
- `createNodes`/`mergeNodes` no longer emit `:GraphNode` for every subject node.
- bulk replace no longer emits the mass `SET n:GraphNode` query.
- new write paths do not create `GraphNode` labels.

Integration tests:

- replace and bulk replace produce equivalent snapshots under the new model.
- incremental update can still create edges for known endpoints using concrete coarse labels.
- unknown endpoint fallback uses `GraphStub`.

Performance measurement:

```bash
DEBUG=1 pnpm --filter @nakidka/cli dev update-graph /private/tmp/erp_nkdk --replace --bulk
```

Success criteria:

- no `SET n:GraphNode` phase inside bulk write;
- `GRAPH.BULK` commands still complete;
- total bulk write time is dominated by actual `GRAPH.BULK` calls and index creation, not mass label mutation;
- tests pass with the new label model.
