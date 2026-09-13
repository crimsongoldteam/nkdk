"""Inventory candidate rooted references in immutable e2e XML; not a conversion test."""
import hashlib
import json
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from pathlib import Path

root = Path(__file__).resolve().parents[3]
vocabulary = json.loads((root / "tests/migration/metadata-path-lexicons.json").read_text())
roots = {row["xml"] for row in vocabulary["tables"][0]["values"]}
counts, lengths = Counter(), Counter()
examples, errors = defaultdict(list), []
contexts = {}
files = sorted((root / "e2e/fixtures/xml").rglob("*.xml"))
for source in files:
    contents = source.read_bytes()
    try:
        document = ET.fromstring(contents)
    except ET.ParseError as error:
        errors.append({"source": str(source.relative_to(root)), "error": str(error)})
        continue
    parents = {child: parent.tag for parent in document.iter() for child in parent}
    digest = hashlib.sha256(contents).hexdigest()
    for ordinal, element in enumerate(document.iter()):
        if len(element) or not element.text:
            continue
        parts = element.text.split(".")
        if len(parts) < 2 or parts[0] not in roots:
            continue
        counts[parts[0]] += 1
        lengths[len(parts)] += 1
        sample = {
            "source": str(source.relative_to(root)),
            "sha256": digest,
            "elementOrdinal": ordinal,
            "tag": element.tag,
            "text": element.text,
        }
        if len(examples[parts[0]]) < 3:
            examples[parts[0]].append(sample)
        context_key = (len(parts), parents.get(element, ""), element.tag)
        context = contexts.setdefault(context_key, {
            "segments": len(parts), "parent": context_key[1], "tag": element.tag,
            "occurrences": 0, "examples": [],
        })
        context["occurrences"] += 1
        if len(context["examples"]) < 3:
            context["examples"].append(sample)
    assert source.read_bytes() == contents, f"Source changed during inventory: {source}"
report = {
    "scope": "Candidate rooted leaf texts only; relative references and type-prefixed names are not counted",
    "xmlFiles": len(files),
    "candidateOccurrences": sum(counts.values()),
    "byRoot": dict(sorted(counts.items())),
    "bySegmentCount": dict(sorted(lengths.items())),
    "examples": dict(sorted(examples.items())),
    "byPropertyContext": [contexts[key] for key in sorted(contexts)],
    "parseErrors": errors,
}
output = root / "tests/migration/metadata-path-inventory.json"
output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
print(f"{len(files)} XML files, {sum(counts.values())} candidates, {len(errors)} parse errors")
