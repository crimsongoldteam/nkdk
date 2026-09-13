"""Inventory nested metadata identity states from unchanged e2e XML.

This is an independent migration audit, not a production identity resolver.
Print deterministic JSON; parse failures remain visible in the report.
"""
import hashlib
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "e2e/fixtures/xml"
MD = "{http://v8.1c.ru/8.3/MDClasses}"
XR = "{http://v8.1c.ru/8.3/xcf/readable}"


def state(element):
    if element is None:
        return "missing"
    if len(element) or element.attrib:
        return "structured"
    return "text" if element.text else "empty"


def component(path):
    parts = path.relative_to(SOURCE).parts
    return "/".join(parts[:2]) if parts[0] in ("cfe", "epf", "erf") else parts[0]


def collect():
    rows, failures = [], []
    for source in sorted(SOURCE.rglob("*.xml")):
        content = source.read_bytes()
        try:
            document = ET.fromstring(content)
        except ET.ParseError as error:
            failures.append({"source": str(source.relative_to(ROOT)), "error": str(error)})
            continue
        if document.tag != MD + "MetaDataObject":
            continue
        digest = hashlib.sha256(content).hexdigest()

        def visit(node, ancestors, owner_uuid=None):
            properties = node.find(MD + "Properties")
            name = None if properties is None else properties.findtext(MD + "Name")
            if node.tag.startswith(MD) and name is not None:
                part = {"kind": node.tag[len(MD):], "name": name}
                extended = properties.find(MD + "ExtendedConfigurationObject")
                info = node.find(MD + "InternalInfo")
                modes = []
                if info is not None:
                    for item in info.iter():
                        property_name = item.findtext(XR + "Property")
                        if property_name == "ExtendedConfigurationObject":
                            modes.append(ET.tostring(item, encoding="unicode"))
                rows.append({
                    "source": str(source.relative_to(ROOT)), "sha256": digest,
                    "component": component(source), "ancestors": ancestors, "ownerUuid": owner_uuid,
                    **part, "uuid": node.get("uuid"),
                    "belonging": properties.findtext(MD + "ObjectBelonging"),
                    "baseState": state(extended),
                    "baseUuid": None if extended is None else extended.text,
                    "internalInfo": state(info), "basePropertyStates": modes,
                })
                ancestors = [*ancestors, part]
                owner_uuid = node.get("uuid")
            for child in node:
                visit(child, ancestors, owner_uuid)

        visit(document, [])
    return rows, failures


def _file_keys(rows):
    keys = defaultdict(list)
    for row in rows:
        key = json.dumps([row["source"], row["ancestors"], row["kind"], row["name"]], ensure_ascii=False)
        keys[key].append(row["source"])
    return keys


def report():
    rows, failures = collect()
    base_by_uuid = defaultdict(list)
    keys = defaultdict(list)
    for row in rows:
        key = json.dumps([row["component"], row["ancestors"], row["kind"], row["name"]], ensure_ascii=False)
        keys[key].append(row["source"])
        if row["component"] == "cf" and row["uuid"]:
            base_by_uuid[row["uuid"]].append(row)
    nested = [row for row in rows if row["ancestors"]]
    for row in nested:
        matches = base_by_uuid.get(row["baseUuid"], [])
        row["baseMatches"] = [{"source": item["source"], "kind": item["kind"], "name": item["name"], "ancestors": item["ancestors"]} for item in matches]
    shapes = Counter((row["kind"], row["belonging"], row["baseState"], row["internalInfo"]) for row in nested)
    return {
        "scope": "Nested MDClasses objects with Properties/Name; e2e only. No acceptance or production resolver is implied.",
        "summary": {"objects": len(rows), "nested": len(nested), "kinds": len({row["kind"] for row in nested}),
                    "missingUuid": sum(row["uuid"] is None for row in nested),
                    "baseReferences": sum(bool(row["baseUuid"]) for row in nested),
                    "unresolvedBaseReferences": sum(bool(row["baseUuid"]) and len(row["baseMatches"]) != 1 for row in nested)},
        "shapes": [{"kind": key[0], "belonging": key[1], "baseState": key[2], "internalInfo": key[3], "count": count} for key, count in sorted(shapes.items(), key=lambda item: str(item[0]))],
        "nameOnlyCollisions": [{"key": json.loads(key), "sources": paths} for key, paths in sorted(keys.items()) if len(paths) > 1],
        "parseFailures": failures, "rows": nested,
        "fileScopedDuplicateKeys": [
            {"key": json.loads(key), "sources": paths}
            for key, paths in sorted(_file_keys(nested).items()) if len(paths) > 1
        ],
    }


if __name__ == "__main__":
    result = report()
    if sys.argv[1:] == ["--check"]:
        expected = json.loads((ROOT / "tests/migration/nested-identity-inventory.json").read_text())
        if result != expected:
            raise SystemExit("Identity inventory is stale; regenerate it from e2e XML")
        if result["parseFailures"] or result["fileScopedDuplicateKeys"]:
            raise SystemExit("Identity sources contain parse failures or ambiguous structural keys")
        for row in result["rows"]:
            if not row["baseUuid"]:
                continue
            matches = row["baseMatches"]
            if len(matches) != 1 or any(row[key] != matches[0][key] for key in ("kind", "name", "ancestors")):
                raise SystemExit(f"Unresolved or inconsistent base identity: {row['source']} {row['name']}")
        print(json.dumps(result["summary"], ensure_ascii=False))
    elif sys.argv[1:]:
        raise SystemExit("Usage: nested-identity-inventory.py [--check]")
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))
