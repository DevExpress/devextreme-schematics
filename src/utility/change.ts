import { Tree } from '@angular-devkit/schematics';
import { InsertChange, Change } from '@schematics/angular/utility/change';

import {
  Node
} from 'typescript';

export function applyChanges(host: Tree, changes: Change[], filePath: string) {
  const recorder = host.beginUpdate(filePath);

  changes.forEach((change: InsertChange) => {
    recorder.insertLeft(change.pos, change.toAdd);
  });

  host.commitUpdate(recorder);

  return host;
}

// TODO: implement options.index
// TODO: implement spaces shift calculation
export function insertItemToArray(
  host: Tree,
  filePath: string,
  node: Node,
  item: string,
  options: { location: 'start' | 'end' } = { location: 'start' }
) {
  if (!/^\s*\{[\s\S]*\}\s*$/m.test(item)) {
    return host;
  }

  const nodeContent = node.getText();
  const isEmpty = !/\[[\s\S]*\S+[\s\S]*\]/m.test(nodeContent);
  const nodePosition = node.getStart();
  const leftBracketPosition = nodePosition + nodeContent.indexOf('[');
  const rightBracketPosition = nodePosition + nodeContent.lastIndexOf(']');
  let itemPosition = leftBracketPosition + 1;
  let fileRecorder = host.beginUpdate(filePath);

  item = `
` + item;

  if (isEmpty) {
    const formattedArray = `[
]`;
    fileRecorder.remove(leftBracketPosition, rightBracketPosition - leftBracketPosition + 1);
    fileRecorder.insertLeft(leftBracketPosition, formattedArray);
    host.commitUpdate(fileRecorder);
    fileRecorder = host.beginUpdate(filePath);
  } else {
    if (options.location === 'end') {
      itemPosition = nodePosition + nodeContent.lastIndexOf('}') + 1;
      item = ',' + item;
    } else {
      item = item + ',';
    }
  }

  fileRecorder.insertLeft(itemPosition, item);
  host.commitUpdate(fileRecorder);

  return host;
}
