export interface ApiSpecModel {
  [key:string]: any;
  dbset: string;
  model: string;
  actions: any;
  properties: PropertyModel[];
}

export interface PropertyModel {
  name: string;
  type: string;
  format: string;
  isKey: boolean;
  lookupAction: string;
}

export interface LookupModel {
  name: string;
  action: string;
}
