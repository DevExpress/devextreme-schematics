import { ApiSpecModel, PropertyModel, LookupModel } from './api-spec-model';

export function getDbName(model: ApiSpecModel) : string {
  return model.dbset;
}

export function GetProperty(model: ApiSpecModel, name: string) : PropertyModel {
  let index = model.properties.findIndex((item) => item.name === name);
  return model.properties[index];
}

export function getLoadUrl(model: ApiSpecModel) : string {
  return getActionUrlByMethod(model, 'GET');
}

export function getInsertUrl(model: ApiSpecModel) : string {
  return getActionUrlByMethod(model, 'POST');
}

export function getUpdateUrl(model: ApiSpecModel) : string {
  return getActionUrlByMethod(model, 'PUT');
}

export function getDeleteUrl(model: ApiSpecModel) : string {
  return getActionUrlByMethod(model, 'DELETE');
}

function getActionUrlByMethod(model: ApiSpecModel, method: string) : string {
  for(let name in model.actions) {
    if(model.actions[name].method === method)
      return name;
  }
  return "";
}

export function getKeyDataProperty(model: ApiSpecModel) : any {
  let properties:PropertyModel[] = model.properties.filter((item) => item.isKey === true);
  if(properties.length > 1)
    return properties.map((item) => { return item.name; });
  if(properties.length === 1)
    return properties[0].name;
  return "";
}

export function isLookup(item:PropertyModel) : boolean {
  return item.lookupAction != null;
}

export function getDataLookups(model: ApiSpecModel) : LookupModel[] {
  let properties:PropertyModel[] = model.properties.filter((item, pos) => {
    return isLookup(item) && model.properties.indexOf(item) === pos;
  });

  return properties.map((item) => {
    return {
      name: getLookupName(item),
      action: item.lookupAction
    } as LookupModel;
  });
}

export function getLookupName(item:PropertyModel) : string {
  return item.lookupAction.split('/').pop() as string;
}
