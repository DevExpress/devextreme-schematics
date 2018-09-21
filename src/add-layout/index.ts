import { Rule, SchematicContext, Tree, apply, url, move, chain, mergeWith, SchematicsException, schematic } from '@angular-devkit/schematics';
import {
  getApplicationPath,
  getProjectName
 } from '../utility/get-project';

 import { getSourceFile } from '../utility/source';

 import {
  addImportToModule
} from '@schematics/angular/utility/ast-utils';

import {
  applyChanges
} from '../utility/change';

const componentContent = `
<app-layout>
    <router-outlet></router-outlet>

    <div class="footer">
        Copyright © 2011-2018 Developer Express Inc.
        <br/>
        All trademarks or registered trademarks are property of their respective owners.
    </div>
</app-layout>
`

function addImportToAppModule(rootPath: string, importName: string, path: string) {
  return (host: Tree) => {
    const appModulePath = rootPath + 'app.module.ts';
    const source = getSourceFile(host, appModulePath);

    if (!source) {
      return host;
    }

    const changes = addImportToModule(source, appModulePath, importName, path);

    return applyChanges(host, changes, appModulePath);
  }
}

function addContentToAppModule(rootPath: string, component: string) {
  return(host: Tree) => {
    const appModulePath = rootPath + component;
    const source = getSourceFile(host, appModulePath);

    if (!source) {
      return host;
    }

    host.overwrite(appModulePath, componentContent);

    return host;
  }
}

function getComponentName(host: Tree, rootPath: string) {
  let name = '';
  let index = 1;

  if (!host.exists(rootPath + 'app.component.ts')) {
    name = 'app';
  }

  while (!name) {
    const componentName = `app${index}.component.ts`;
    if (!host.exists(rootPath + componentName)) {
      name = componentName;
    }
  }

  return name;
}

function findLayout(layout: string) {
  const layouts = ["side-nav-outer-toolbar"];

  return layouts.some((item) => item === layout);
}

function hasRoutingModule(host: Tree, rootPath: string) {
  return host.exists(rootPath + 'app-routing.module.ts');
}

export default function(options: any): Rule {
  return (host: Tree, _context: SchematicContext) => {
    const project = getProjectName(host, options.project);
    const rootPath = getApplicationPath(host, project);
    const layout = options.layout;

    if(!findLayout(layout)) {
      throw new SchematicsException(`${layout} layout not found.`);
    }

    let rules = [
      mergeWith(
        apply(url('./files/shared'), [
          move(rootPath + 'shared/')
        ])
      ),
      mergeWith(
        apply(url(`./files/menu/${options.layout}`), [
          move(rootPath + 'shared/navigation-menu/')
        ])
      ),
      mergeWith(
        apply(url('./files/navigations'), [
          move(rootPath)
        ])
      ),
      mergeWith(
        apply(url(`./files/layouts/${options.layout}`), [
          move(rootPath + 'layout/')
        ])
      ),
      mergeWith(
        apply(url('./files/themes'), [
          move(rootPath.replace(/app\//, '') + 'themes/')
        ])
      ),
      addImportToAppModule(rootPath, 'AppLayoutModule', './layout/layout.component')
    ];

    if(!hasRoutingModule(host, rootPath)) {
      rules.push(mergeWith(
        apply(url('./files/routing'), [
          move(rootPath)
        ])
      ));

      rules.push(addImportToAppModule(rootPath, 'AppRoutingModule', './app-routing.module'));
    }

    if(options.overwriteComponent) {
      rules.push(addContentToAppModule(rootPath, 'app.component.html'));
    } else {
      const name = getComponentName(host, rootPath);

      rules.push(schematic('component', { name, project, spec: false, module: 'app' }));
      rules.push(addContentToAppModule(rootPath, name));
    }

    return chain(rules);
  };
}
