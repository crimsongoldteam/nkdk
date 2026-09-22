import {sourceProgram} from './source-program.mjs';
import {evaluator,serialize} from './static-value.mjs';
import {ts} from './syntax.mjs';

function variable(program,name) {
  for(const file of program.parsed.values())for(const statement of file.statements) {
    if(!ts.isVariableStatement(statement))continue;
    for(const declaration of statement.declarationList.declarations) {
      if(ts.isIdentifier(declaration.name) && declaration.name.text===name)return declaration;
    }
  }
  throw new Error(`Missing standard member declaration: ${name}`);
}

function staticValue(evaluate,declaration) {
  const issues=[];
  const value=serialize(evaluate(declaration.initializer),issues);
  if(issues.length)throw new Error(`Unresolved standard member declaration: ${declaration.name.getText()}`);
  return value;
}

export function standardMemberPolicies(sources,ownerKind) {
  const program=sourceProgram(sources),evaluate=evaluator(program);
  const shared=staticValue(evaluate,variable(program,'commonStandardAttributeFillValuePolicies'));
  const members=new Map();
  for(const file of program.parsed.values())for(const statement of file.statements) {
    if(!ts.isVariableStatement(statement))continue;
    for(const declaration of statement.declarationList.declarations) {
      if(!ts.isIdentifier(declaration.name) || !declaration.name.text.endsWith('StandardMemberRules'))continue;
      const contributions=staticValue(evaluate,declaration);
      if(!Array.isArray(contributions))throw new Error(`Invalid standard member contribution: ${declaration.name.text}`);
      for(const contribution of contributions) {
        if(contribution.kind!=='standardMembers' || contribution.ownerKind!==ownerKind)continue;
        for(const member of contribution.members) {
          const internal=member.names?.internal;
          if(typeof internal!=='string' || members.has(internal))throw new Error(`Ambiguous standard member: ${ownerKind}.${internal}`);
          members.set(internal,{...member,...(member.fillValue===undefined && shared[internal]!==undefined?{fillValue:shared[internal]}:{})});
        }
      }
    }
  }
  if(!members.size)throw new Error(`No standard members for ${ownerKind}`);
  return members;
}

export function standardFillPolicyInputs(member,facts,xmlToYamlRoot) {
  const declaration=member.fillValue??{policy:'notSpecified'};
  const result={policy:declaration.policy,expectedKind:'',owners:[],maxTextLength:'',maxNumberDigits:'',allowedTextLength:''};
  const length=value=>value===undefined?'':String(value);
  switch(declaration.policy) {
    case 'forbidden':
    case 'notSpecified':
      break;
    case 'ownerReference':
      result.expectedKind='reference';
      result.owners=(facts[declaration.ownersProperty]??[]).map(owner=>{
        const position=owner.indexOf('.'),root=owner.slice(0,position),name=owner.slice(position+1);
        if(position<1 || !name || !xmlToYamlRoot[root])throw new Error(`Unknown standard owner: ${owner}`);
        return `${xmlToYamlRoot[root]}.${name}`;
      });
      break;
    case 'codeFromOwner': {
      const type=facts[declaration.typeProperty];
      if(type==='String' || type==='Строка') {
        result.expectedKind='text';
        result.maxTextLength=length(facts[declaration.lengthProperty]);
        result.allowedTextLength=facts[declaration.allowedLengthProperty]??'';
      } else if(type==='Number' || type==='Число') {
        result.expectedKind='decimal';
        result.maxNumberDigits=length(facts[declaration.lengthProperty]);
      }
      break;
    }
    case 'stringFromOwner':
      result.expectedKind='text';
      result.maxTextLength=length(facts[declaration.lengthProperty]);
      break;
    case 'byEffectiveType':
      result.expectedKind={string:'text',number:'decimal',boolean:'boolean',dateTime:'calendar'}[member.kind]??'';
      break;
    default:
      throw new Error(`Unknown FillValue policy: ${declaration.policy}`);
  }
  return result;
}

// Emit data expressions for the generic declaration compiler. The source
// members select the profile; owner properties stay typed inputs of the row.
export function standardFillProfileExpressions(members) {
  const fields=['policy','expectedKind','maxTextLength','maxNumberDigits','allowedTextLength'];
  const defaults={policy:'notSpecified',expectedKind:'',maxTextLength:'',maxNumberDigits:'',allowedTextLength:''};
  const facts=new Set();
  const literal=value=>({literal:value});
  const input=name=>{facts.add(name);return {input:name};};
  const equals=(value,expected)=>({eq:[value,literal(expected)]});
  const typeIs=(name,english,russian)=>({or:[equals({input:name},english),equals({input:name},russian)]});
  const profiles=[];
  for(const [name,member] of members) {
    const declaration=member.fillValue??{policy:'notSpecified'};
    const profile=Object.fromEntries(fields.map(field=>[field,literal(defaults[field])]));
    profile.policy=literal(declaration.policy);
    switch(declaration.policy) {
      case 'forbidden':
      case 'notSpecified': break;
      case 'ownerReference':
        profile.expectedKind=literal('reference');
        break;
      case 'stringFromOwner':
        profile.expectedKind=literal('text');
        profile.maxTextLength=input(declaration.lengthProperty);
        break;
      case 'codeFromOwner': {
        const type=declaration.typeProperty,length=declaration.lengthProperty;
        facts.add(type);
        profile.expectedKind={if:typeIs(type,'String','Строка'),then:literal('text'),
          else:{if:typeIs(type,'Number','Число'),then:literal('decimal'),else:literal('')}};
        profile.maxTextLength={if:typeIs(type,'String','Строка'),then:input(length),else:literal('')};
        profile.maxNumberDigits={if:typeIs(type,'Number','Число'),then:input(length),else:literal('')};
        profile.allowedTextLength={if:typeIs(type,'String','Строка'),then:input(declaration.allowedLengthProperty),else:literal('')};
        break;
      }
      case 'byEffectiveType':
        profile.expectedKind=literal({string:'text',number:'decimal',boolean:'boolean',dateTime:'calendar'}[member.kind]??'');
        break;
      default: throw new Error(`Unknown FillValue policy: ${declaration.policy}`);
    }
    profiles.push([name,profile]);
  }
  const expressions=Object.fromEntries(fields.map(field=>{
    let value=literal(defaults[field]);
    for(const [name,profile] of profiles.toReversed()) {
      const candidate=profile[field];
      if(JSON.stringify(candidate)===JSON.stringify(literal(defaults[field])))continue;
      value={if:equals({field:'name'},name),then:candidate,else:value};
    }
    return [field,value];
  }));
  return {expressions,factInputs:[...facts].sort()};
}
