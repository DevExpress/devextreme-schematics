import {
  Rule,
  SchematicContext,
  Tree,
  apply,
  url,
  move,
  chain,
  noop,
  filter,
  mergeWith,
  template } from '@angular-devkit/schematics';

import { strings } from '@angular-devkit/core';

/* tslint:disable:no-var-requires */
const runNpxCommand = require('devextreme-cli/utility/run-npx-command');
/* tslint:enable:no-var-requires */

import {
  getApplicationPath,
  getRootPath,
  getProjectName
 } from '../utility/project';

import {
  addStylesToApp
 } from '../utility/styles';

import {
  modifyJSONFile
 } from '../utility/modify-json-file';

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

function addBuildThemeScript() {
  return (host: Tree) => {
    modifyJSONFile(host, './package.json', config => {
      const scripts = config['scripts'];

      scripts['build-themes'] = 'devextreme build';

      return config;
    });

    return host;
  };
}

function addCustomThemeStyles(options: any) {
  return (host: Tree) => {
    modifyJSONFile(host, './angular.json', config => {
      const stylesList = [
        './src/themes/generated/theme.base.css',
        './src/themes/generated/theme.additional.css',
        'node_modules/devextreme/dist/css/dx.common.css'
      ];

      return addStylesToApp(host, options.project, config, stylesList);
    });

    return host;
  };
}

function addViewportToRoot(appPath: string) {
  return (host: Tree) => {
    const indexPath = `${appPath.replace(/app\//, '')}index.html`;
    let indexContent = host.read(indexPath)!.toString();

    indexContent = indexContent.replace(/<app-root>/, '<app-root class="dx-viewport">');
    host.overwrite(indexPath, indexContent);

    return host;
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

function getContentForAppComponent(project: string, layout: string) {
  const title = project.split('-').map(part => strings.capitalize(part)).join(' ');
  return `<app-${layout} title="${title}">
    <router-outlet></router-outlet>

    <app-footer>
        Copyright © 2011-2018 Developer Express Inc.
        <br/>
        All trademarks or registered trademarks are property of their respective owners.
    </app-footer>
</app-${layout}>
`;
}

function addContentToAppComponent(rootPath: string, component: string, project: string, layout: string) {
  return(host: Tree) => {
    const appModulePath = rootPath + component;
    const source = getSourceFile(host, appModulePath);
    const componentContent = getContentForAppComponent(project, layout);

    if (!source) {
      return host;
    }

    host.overwrite(appModulePath, componentContent);

    return host;
  };
}

function getComponentName(host: Tree, rootPath: string) {
  let name = '';
  const index = 1;

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

function hasRoutingModule(host: Tree, rootPath: string) {
  return host.exists(rootPath + 'app-routing.module.ts');
}

function addPackagesToDependency() {
  return (host: Tree) => {
    addPackageJsonDependency(host, {
      type: NodeDependencyType.Default,
      name: '@angular/cdk',
      version: '^6.0.0'
    });

    addPackageJsonDependency(host, {
      type: NodeDependencyType.Default,
      name: 'copyfiles',
      version: '^2.1.0'
    });

    return host;
  };
}

export default function(options: any): Rule {
  return (host: Tree) => {
    const project = getProjectName(host, options.project);
    const appPath = getApplicationPath(host, project);
    const rootPath = getRootPath(host, project);
    const layout = options.layout;

    const rules = [
      mergeWith(
        apply(url('./files/src'), [
          options.overrideAppComponent ? filter(path => !path.includes('__name__')) : noop(),
          hasRoutingModule(host, appPath) ? filter(path => !path.includes('app-routing.module')) : noop(),
          template({
            name: getComponentName(host, appPath),
            ...strings,
            content: getContentForAppComponent(project, layout)
          }),
          move(rootPath)
        ])
      ),
      mergeWith(
        apply(url('./files/root'), [
          template({
            engine: '"angular"'
          }),
          move('./')
        ])
      ),
      addImportToAppModule(appPath, 'SideNavOuterToolbarModule', './layouts'),
      addImportToAppModule(appPath, 'SideNavInnerToolbarModule', './layouts'),
      addImportToAppModule(appPath, 'FooterModule', `./shared/components/footer/footer.component`),
      addStyles(appPath),
      addBuildThemeScript(),
      addCustomThemeStyles(options),
      addViewportToRoot(appPath),
      addPackagesToDependency(),
      (_: Tree, context: SchematicContext) => {
        context.addTask(new NodePackageInstallTask());
      }
    ];

    if (options.overrideAppComponent) {
      rules.push(addContentToAppComponent(appPath, 'app.component.html', project, layout));
    }

    if (!hasRoutingModule(host, appPath)) {
      rules.push(addImportToAppModule(appPath, 'AppRoutingModule', './app-routing.module'));
    }

    runNpxCommand(['-c', 'devextreme build'], { cwd: process.cwd() });

    return chain(rules);
  };
}
