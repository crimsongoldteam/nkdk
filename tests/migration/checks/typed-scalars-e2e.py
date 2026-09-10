"""Check declared xs:string/xs:decimal leaf properties on immutable e2e XML."""
import argparse
import copy
import hashlib
import io
import json
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from decimal import Decimal, InvalidOperation
from datetime import datetime
from pathlib import Path
import yaml

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--output", required=True, type=Path)
parser.add_argument("--choices", action="store_true")
args = parser.parse_args()
root = Path(__file__).resolve().parents[3]
binary = root / "rust/target/debug/nkdk"
xsi_type = "{http://www.w3.org/2001/XMLSchema-instance}type"
xs = "http://www.w3.org/2001/XMLSchema"

def shape(source):
    namespaces = dict(value for _, value in ET.iterparse(io.BytesIO(source), events=("start-ns",)))
    def node(element):
        attributes = []
        for key, value in element.attrib.items():
            if key == xsi_type:
                prefix, local = value.split(":", 1)
                value = "{" + namespaces[prefix] + "}" + local
            attributes.append((key, value))
        return element.tag, sorted(attributes), (element.text or "") if not len(element) else "", [node(child) for child in element]
    return node(ET.fromstring(source))

rows = []
with tempfile.TemporaryDirectory(prefix="nkdk-typed-e2e-") as temporary:
    directory = Path(temporary)
    for source in sorted((root / "e2e/fixtures/xml").rglob("*.xml")):
        original = source.read_bytes()
        namespaces = dict(value for _, value in ET.iterparse(io.BytesIO(original), events=("start-ns",)))
        for index, element in enumerate(ET.fromstring(original).iter()):
            kind = element.get(xsi_type, "")
            if args.choices:
                if element.tag == "{http://v8.1c.ru/8.3/xcf/predef}Code" and source.name == "Predefined.xml":
                    entry = "migration.predefined-code"
                elif element.tag in ("{http://v8.1c.ru/8.3/xcf/logform}ReportResult", "{http://v8.1c.ru/8.3/xcf/logform}DetailsData") and source.name == "Form.xml":
                    entry = "migration.string-or-number"
                else:
                    continue
                assert not len(element), source
                key, physical = "Значение", "Value"
            else:
                if len(element) or kind not in ("xs:decimal", "xs:string", "xs:dateTime"):
                    continue
                entry = {"xs:decimal":"migration.typed-number","xs:string":"migration.typed-string","xs:dateTime":"migration.typed-date-time"}[kind]
                key, physical = "Сумма", "Amount"
            if kind:
                assert namespaces.get(kind.split(":")[0]) == xs, source
            wrapper = ET.Element("Root", {"xmlns:" + prefix: uri for prefix, uri in namespaces.items() if prefix and uri == xs})
            value = copy.deepcopy(element)
            value.tag = physical
            value.tail = None
            wrapper.append(value)
            input_xml = ET.tostring(wrapper, encoding="utf-8")
            (directory / "input.xml").write_bytes(input_xml)
            commands = [
                ["convert-file", "--direction", "xml-to-yaml", "--input", str(directory / "input.xml"), "--output", str(directory / "value.yaml")],
                ["validate-file", "--input", str(directory / "value.yaml")],
                ["convert-file", "--direction", "yaml-to-xml", "--input", str(directory / "value.yaml"), "--output", str(directory / "restored.xml")],
            ]
            for command in commands:
                result = subprocess.run([str(binary), *command, "--entry", entry], capture_output=True, text=True)
                assert result.returncode == 0, f"{source}:{index}: {result.stderr}"
            assert shape(input_xml) == shape((directory / "restored.xml").read_bytes()), (source, index)
            document = yaml.compose((directory / "value.yaml").read_text())
            assert isinstance(document, yaml.MappingNode)
            semantic = next((v for k, v in document.value if k.value in (key, physical)), None)
            if semantic is not None and semantic.tag == "!xml/raw":
                semantic = next((v for k, v in semantic.value if k.value == "$значение"), None)
            expected = element.text or ""
            if args.choices and not expected:
                assert semantic is None, (source,index)
            elif kind == "xs:string" or (args.choices and kind not in ("xs:decimal", "xs:integer", "xs:float", "xs:double")):
                assert isinstance(semantic, yaml.ScalarNode) and semantic.tag == "tag:yaml.org,2002:str" and semantic.value == expected, (source, index)
            elif kind == "xs:dateTime":
                try:
                    date = datetime.fromisoformat(expected)
                except ValueError:
                    date = None
                if date is None:
                    assert semantic is None, (source,index)
                else:
                    clock = f"{date.day:02}.{date.month:02}.{date.year:04}"
                    if date.hour or date.minute or date.second:
                        clock += f" {date.hour:02}:{date.minute:02}"
                    assert isinstance(semantic,yaml.ScalarNode) and semantic.value==clock, (source,index)
            else:
                try:
                    number = Decimal(expected)
                except InvalidOperation:
                    number = None
                if number is not None and number.is_finite():
                    assert isinstance(semantic, yaml.ScalarNode) and semantic.tag in ("tag:yaml.org,2002:int", "tag:yaml.org,2002:float") and Decimal(semantic.value) == number, (source, index)
                else:
                    assert semantic is None, (source, index)
            rows.append({"source": str(source.relative_to(root)), "sha256": hashlib.sha256(original).hexdigest(), "occurrence": index, "type": kind, "entry": entry, "verified": True})
        assert source.read_bytes() == original
assert rows, "An empty selection is not success"
scope = "Scalar choice properties" if args.choices else "Typed scalar leaf properties"
args.output.write_text(json.dumps({"scope": scope + "; not whole-project conversion or performance", "verified": len(rows), "cases": rows}, ensure_ascii=False, indent=2) + "\n")
print(f"Verified {len(rows)} {scope}")
