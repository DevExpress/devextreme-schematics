import {
  Rule,
  chain,
  schematic,
} from '@angular-devkit/schematics';

export default function(options: any): Rule {
  let rules = [
    schematic('add-devextreme', {
      dxversion: options.dxversion,
      project: options.project
    }),
    schematic('add-layout', {
      layout: options.layout,
      overwriteComponent: options.overwriteComponent
    })
  ];

  if (!options.empty) {
    rules.push(schematic('add-sample-views', {}));
  }

  return chain(rules);
};
