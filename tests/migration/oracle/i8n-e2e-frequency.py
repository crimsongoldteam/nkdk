from pathlib import Path
from collections import Counter,defaultdict
import xml.etree.ElementTree as E
import json,hashlib
import argparse
parser=argparse.ArgumentParser(description='Read-only census of localized XML in the e2e corpus')
parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[3])
parser.add_argument('--output',type=Path,required=True)
args=parser.parse_args()
root=args.root
base=root/'e2e/fixtures/xml'
V='{http://v8.1c.ru/8.1/data/core}'
files=sorted(base.rglob('*.xml')); trees=[]; errors=[]; known=set(); digest=hashlib.sha256()
for p in files:
 b=p.read_bytes();digest.update(str(p.relative_to(base)).encode()+b'\0'+hashlib.sha256(b).digest())
 if not b.strip():continue
 try:t=E.fromstring(b)
 except E.ParseError as e:errors.append({'file':str(p.relative_to(base)),'error':str(e)});continue
 trees.append((p,t))
 for e in t.iter():
  if e.find(V+'item/'+V+'lang') is not None:known.add(e.tag)
rows=[]
def visit(e,path,p):
 items=e.findall(V+'item'); codes=[i.findtext(V+'lang') for i in items]
 if (e.tag in known and (not list(e) or items)) or e.tag.rsplit('}',1)[-1]=='Synonym':
  ru=[i for i in items if i.findtext(V+'lang')=='ru']
  empty=[i for i in ru if i.find(V+'content') is not None and ''.join(i.find(V+'content').itertext())=='']
  malformed=[i for i in ru if i.find(V+'content') is None]
  nonempty=[i for i in ru if i not in empty and i not in malformed]
  category='ru-absent-with-other' if not ru and items else 'no-items' if not items else 'ru-malformed' if malformed else 'ru-empty-and-nonempty' if empty and nonempty else 'ru-empty-only' if empty else 'ru-nonempty'
  rows.append({'file':str(p.relative_to(base)),'path':path,'tag':e.tag,'category':category,'items':len(items),'emptyRu':len(empty)})
 counts=Counter()
 for ch in e:
  counts[ch.tag]+=1; visit(ch,path+'/'+ch.tag.rsplit('}',1)[-1]+f'[{counts[ch.tag]}]',p)
for p,t in trees:visit(t,'/'+t.tag.rsplit('}',1)[-1]+'[1]',p)
def summary(rs):
 groups=defaultdict(Counter)
 for r in rs:groups[r['file'].split('/')[0] if r['file'].startswith('cf/') else '/'.join(r['file'].split('/')[:2])][r['category']]+=1
 return {'total':dict(Counter(r['category'] for r in rs)),'components':{k:dict(v) for k,v in groups.items()}}
result={'files':len(files),'parsed':len(trees),'parseErrors':errors,'corpusSha256':digest.hexdigest(),'candidateContainers':summary(rows),'synonyms':summary([r for r in rows if r['tag'].endswith('}Synonym')]),'emptyExamples':[r for r in rows if r['emptyRu']],'absentOtherExamples':[r for r in rows if r['category']=='ru-absent-with-other'],'rows':rows}
confirmed=[r for r in rows if r['path'] in ['/MetaDataObject[1]/Catalog[1]/Properties[1]/Synonym[1]', '/MetaDataObject[1]/Document[1]/Properties[1]/Synonym[1]']]
result['confirmedFoldableCatalogDocumentSynonyms']=summary(confirmed)
result['scope']='e2e XML only; ru is the configured default in cf and each cfe. Present containers only; absent properties are not inferred. Candidate container names are discovered from actual v8:item/v8:lang and include empty nodes of those expanded names; this broad set is not a registry-resolved count. Synonym and the confirmed root Catalog/Document subset are reported separately. Empty means existing v8:content with zero characters; whitespace is not trimmed. All physical duplicates are counted. Generated YAML, synthetic migration cases and unit fixtures are excluded.'
result.pop('rows')
args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k!='rows'},ensure_ascii=False,indent=2))
