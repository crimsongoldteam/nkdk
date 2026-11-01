"""Read one element with the source document's namespace context; never write it."""
import json
import sys
import xml.etree.ElementTree as xml

path, name = sys.argv[1:]
namespaces = {prefix: uri for _, (prefix, uri) in xml.iterparse(path, events=["start-ns"])}
for prefix, uri in namespaces.items():
    xml.register_namespace(prefix, uri)
root = xml.parse(path).getroot()
elements = [element for element in root.iter() if element.tag.split("}")[-1] == name]
if len(elements) != 1:
    raise ValueError("Expected exactly one selected XML element")
rendered = xml.tostring(elements[0], encoding="unicode")
header, rest = rendered.split(">", 1)
closing = "/" if header.endswith("/") else ""
header = header.removesuffix("/")
# ElementTree omits namespaces used only in QName-valued text/attributes.
# They remain necessary to interpret those values in the extracted fragment.
for prefix, uri in namespaces.items():
    attribute = "xmlns" + (":" + prefix if prefix else "")
    if attribute + "=" not in header:
        header += " " + attribute + '="' + uri + '"'
print(json.dumps({"namespaces": namespaces, "xml": header + closing + ">" + rest}))
