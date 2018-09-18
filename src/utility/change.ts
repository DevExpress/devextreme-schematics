import { Tree } from '@angular-devkit/schematics';
import { InsertChange } from '@schematics/angular/utility/change';

function getSeparator(text: string) {
  const isEmpty = text.search(/}\s*,?\s*]/g) !== -1;
  return isEmpty ? ', ' : '';
}

export function addValueToEndOfArray(host: Tree, changes: any, filePath: string, content?: string, endIndex?: number) {

  let recorder = host.beginUpdate(filePath);

  if (Array.isArray(changes)) {
    for (const change of changes) {
      recorder.insertLeft(change.pos, change.toAdd);
    }
  } else if (content) {
    const position = content!.lastIndexOf(']', endIndex);

    if (position > -1) {
      changes = getSeparator(content) + changes;
      let insertData = new InsertChange(filePath, position, changes);

      recorder.insertLeft(insertData.pos, insertData.toAdd);
    }
  }

  host.commitUpdate(recorder);

  return host;
}
