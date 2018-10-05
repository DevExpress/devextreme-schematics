export interface ComponentOptionsModel {
  [key: string]: any;
  controlToScaffold: string;
  columns: string[];
  editing: EditinigModel;
}

export interface EditinigModel {
  allowAdding: boolean;
  allowUpdating: boolean;
  allowDeleting: boolean;
}
