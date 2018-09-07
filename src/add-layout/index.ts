import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

export function addLayout(): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return tree;
  };
}
