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
