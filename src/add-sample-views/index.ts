import { Rule, SchematicContext, Tree, chain } from '@angular-devkit/schematics';

import {
  addDeclarationToModule
} from '@schematics/angular/utility/ast-utils';

import { addViewToRouting } from '../add-view';

import {
  getApplicationPath,
  getProjectName
 } from '../utility/get-project';

 import {
  applyChanges
 } from '../utility/change';

 import { getSourceFile } from '../utility/source';

const sampleViewOptions = [
  {
    name: 'home',
    componentName: 'HomeComponent',
    relativePath: './pages/home/home.component'
  }, {
    name: 'profile',
    componentName: 'ProfileComponent',
    relativePath: './pages/profile/profile.component'
  }, {
    name: 'display-data',
    componentName: 'DisplayDataComponent',
    relativePath: './pages/display-data/display-data.component'
  }];

function importSampleToRoutingModule(routingPath: string, options: any) {
  return (host: Tree) => {
    const source = getSourceFile(host, routingPath);
    const changes = addDeclarationToModule(source, routingPath, options.componentName, options.relativePath);

    return applyChanges(host, changes, routingPath);
  }
}

export default function(options: any): Rule {
  return (host: Tree, _context: SchematicContext) => {
    const project = getProjectName(host, options.project);
    const routingPath = getApplicationPath(host, project) + '/app-routing.module.ts';
    let rules: any[] = [];

    sampleViewOptions.forEach((view) => {
      rules.push(importSampleToRoutingModule(routingPath, view));
      rules.push(addViewToRouting({ name: view.name, project, module: 'app-routing' }));
    });

    const rule = chain(rules);

    return rule(host, _context);
  };
}
