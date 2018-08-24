import {
  Rule,
  chain,
  schematic
} from '@angular-devkit/schematics';
 
export default function(options: any): Rule {
  return chain([
    schematic('ng-new', { name: options.name, version: '6' })
  ]);
};
