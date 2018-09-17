import {
  Rule,
  SchematicContext,
  Tree,
  chain,
  apply,
  move,
  url,
  mergeWith
} from '@angular-devkit/schematics';

import {
  addDeclarationToModule,
  addImportToModule
} from '@schematics/angular/utility/ast-utils';

import { addViewToRouting } from '../add-view';

import {
  getApplicationPath,
  getProjectName
 } from '../utility/project';

 import {
  applyChanges,
  getPositionInFile,
  getSeparator
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

const devextremeOptions = [
  {
    componentName: 'DxDataGridModule',
    relativePath: 'devextreme-angular'
  }, {
    componentName: 'DxFormModule',
    relativePath: 'devextreme-angular'
}];

const navigations = `
    {
        text: 'Home',
        path: '/home',
        icon: 'home'
    }, {
        text: 'Examples',
        icon: 'folder',
        items: [{
            text: 'Profile',
            path: '/profile'
        }, {
            text: 'Display Data',
            path: '/display-data'
        }]
    }`;

function addImportsToRoutingModule(isView: boolean, routingPath: string, options: any) {
  return (host: Tree) => {
    const source = getSourceFile(host, routingPath);

    if(!source) {
      return host;
    }

    let changes;
    if (isView) {
      changes = addDeclarationToModule(source, routingPath, options.componentName, options.relativePath);
    } else {
      changes = addImportToModule(source, routingPath, options.componentName, options.relativePath);
    }

    return applyChanges(host, changes, routingPath);
  }
}

function insertNavigation(rootPath: string) {
  return (host: Tree) => {
    const navigationPath = rootPath + 'app-navigation.ts';
    const navigationSource = getSourceFile(host, navigationPath);

    if(!navigationSource) {
      return host;
    }

    const changes = {
      pos: getPositionInFile(navigationSource, navigationSource.getEnd()),
      toAdd: getSeparator(navigationSource.getText()) + navigations
    };

    return applyChanges(host, changes, navigationPath);
  };
}

export default function(options: any): Rule {
  return (host: Tree, _context: SchematicContext) => {
    const project = getProjectName(host, options.project);
    const rootPath = getApplicationPath(host, project);
    const routingPath = rootPath + 'app-routing.module.ts';
    let rules: any[] = [];

    const templateSource = apply(url('./files'), [
      move(rootPath)
    ]);

    rules.push(mergeWith(templateSource));

    sampleViewOptions.forEach((viewOptions) => {
      rules.push(addViewToRouting({ name: viewOptions.name, project, module: 'app-routing' }));
      rules.push(addImportsToRoutingModule(true, routingPath, viewOptions));
    });

    devextremeOptions.forEach((moduleOptions) => {
      rules.push(addImportsToRoutingModule(false, routingPath, moduleOptions));
    });

    rules.push(insertNavigation(rootPath));

    return chain(rules);
  };
}
