import {
  Rule,
  SchematicContext,
  Tree,
  apply,
  url,
  move,
  chain,
  mergeWith,
  SchematicsException,
  template } from '@angular-devkit/schematics';

import {
  getApplicationPath,
  getProjectName
 } from '../utility/project';

 import {
  NodeDependencyType,
  addPackageJsonDependency
} from '@schematics/angular/utility/dependencies';

import {
  NodePackageInstallTask
} from '@angular-devkit/schematics/tasks';

 import { getSourceFile } from '../utility/source';

 import {
  addImportToModule
} from '@schematics/angular/utility/ast-utils';

import {
  InsertChange
} from '@schematics/angular/utility/change';

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
</app-layout>`;

const styles = `
html, body {
  margin: 0px;
  min-height: 100%;
  height: 100%;
}

* {
  box-sizing: border-box;
}`;

function addStyles(rootPath: string) {
  return (host: Tree) => {
    const stylesPath = rootPath.replace(/app\//, '') + 'styles.scss';
    const source = getSourceFile(host, stylesPath);

    if (!source) {
      return host;
    }

    const changes = new InsertChange(stylesPath, source.getEnd(), styles);

    return applyChanges(host, [changes], stylesPath);
  };
}

function addImportToAppModule(rootPath: string, importName: string, path: string) {
  return (host: Tree) => {
    const appModulePath = rootPath + 'app.module.ts';
    const source = getSourceFile(host, appModulePath);

    if (!source) {
      return host;
    }

    const changes = addImportToModule(source, appModulePath, importName, path);

    return applyChanges(host, changes, appModulePath);
  };
}

function addContentToAppComponent(rootPath: string, component: string) {
  return(host: Tree) => {
    const appModulePath = rootPath + component;
    const source = getSourceFile(host, appModulePath);

    if (!source) {
      return host;
    }

    host.overwrite(appModulePath, componentContent);

    return host;
  };
}

function getComponentName(host: Tree, rootPath: string) {
  let name = '';
  let index = 1;

  if (!host.exists(rootPath + 'app.component.ts')) {
    name = 'app';
  }

  while (!name) {
    const componentName = `app${index}`;
    if (!host.exists(`${rootPath}${componentName}.component.ts`)) {
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

function addAngularSDKToDependency() {
  return (host: Tree) => {
    addPackageJsonDependency(host, {
      type: NodeDependencyType.Default,
      name: '@angular/cdk',
      version: '^6.0.0'
    });

    return host;
  };
}

export default function(options: any): Rule {
  return (host: Tree, _context: SchematicContext) => {
    const project = getProjectName(host, options.project);
    const rootPath = getApplicationPath(host, project);
    const layout = options.layout;

    if (!findLayout(layout)) {
      throw new SchematicsException(`${layout} layout not found.`);
    }

    let rules = [
      mergeWith(
        apply(url('./files/shared'), [
          move(rootPath + 'shared/components/')
        ])
      ),
      mergeWith(
        apply(url(`./files/menu/${options.layout}`), [
          move(rootPath + 'shared/components/navigation-menu/')
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
      addImportToAppModule(rootPath, 'AppLayoutModule', './layout/layout.component'),
      addStyles(rootPath),
      addAngularSDKToDependency(),
      (_host: Tree, context: SchematicContext) => {
        context.addTask(new NodePackageInstallTask());
      }
    ];

    if (options.overwriteComponent) {
      rules.push(addContentToAppComponent(rootPath, 'app.component.html'));
    } else {
      const name = getComponentName(host, rootPath);
      rules.push(mergeWith(
        apply(url('./files/component'), [
          template({
            'name': name,
            'content': componentContent
          }),
          move(rootPath)
        ])
      ));
    }

    if (!hasRoutingModule(host, rootPath)) {
      rules.push(mergeWith(
        apply(url('./files/routing'), [
          move(rootPath)
        ])
      ));

      rules.push(addImportToAppModule(rootPath, 'AppRoutingModule', './app-routing.module'));
    }

    return chain(rules);
  };
}
