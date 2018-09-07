import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

export function addSampleViews(): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return tree;
  };
}
