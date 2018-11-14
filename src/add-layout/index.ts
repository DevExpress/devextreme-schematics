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

import { spawn } from 'child_process';
import { existsSync } from 'fs';

import { strings } from '@angular-devkit/core';

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

const appComponentContent = `<app-layoutName title={{title}}>
<router-outlet></router-outlet>

<app-footer>
    Copyright © 2011-2018 Developer Express Inc.
    <br/>
    All trademarks or registered trademarks are property of their respective owners.
</app-footer>
</app-layoutName>
`;

const e2eTestContet = `import { AppPage } from './app.po';

describe('workspace-project App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to appName!');
  });
});
`;

const testUtilsContent = `import { browser, by, element } from 'protractor';

export class AppPage {
  navigateTo() {
    return browser.get('/');
  }

  getParagraphText() {
    return element(by.css('app-root .dx-drawer-content .dx-card p:nth-child(2)')).getText();
  }
}
`;

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

function addCustomThemeStyles(options: any, rootPath: string) {
  return (host: Tree) => {
    modifyJSONFile(host, './angular.json', config => {
      const stylesList = [
        `${rootPath}/themes/generated/theme.base.css`,
        `${rootPath}/themes/generated/theme.additional.css`,
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

function overrideContentInFile(path: string, content: string) {
  return(host: Tree) => {
    const source = getSourceFile(host, path);

    if (!source) {
      return host;
    }

    host.overwrite(path, content);

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
      version: '^7.0.0'
    });

    addPackageJsonDependency(host, {
      type: NodeDependencyType.Default,
      name: 'copyfiles',
      version: '^2.1.0'
    });

    return host;
  };
}

function buildThemes() {
  const command = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
  const spawnOptions = {
    stdio:  [process.stdin, process.stdout, process.stderr],
    shell: true,
    cwd: process.cwd()
  };

  spawn(command, ['run', 'build-themes'], spawnOptions);
}

export default function(options: any): Rule {
  return (host: Tree) => {
    const project = getProjectName(host, options.project);
    const appPath = getApplicationPath(host, project);
    const rootPath = getRootPath(host, project);
    const layout = options.layout;
    const override = options.resolveConflicts === 'override';

    const rules = [
      mergeWith(
        apply(url('./files/src'), [
          override ? filter(path => !path.includes('__name__')) : noop(),
          hasRoutingModule(host, appPath) ? filter(path => !path.includes('app-routing.module')) : noop(),
          template({
            name: getComponentName(host, appPath),
            path: rootPath.replace(/\/?(\w)+\/?/g, '../'),
            ...strings,
            content: appComponentContent.replace('layoutName', layout)
          }),
          move(rootPath)
        ])
      ),
      mergeWith(
        apply(url('./files/root'), [
          template({
            engine: '"angular"',
            sourcePath: rootPath
          }),
          move('./')
        ])
      ),
      addImportToAppModule(appPath, 'SideNavOuterToolbarModule', './layouts'),
      addImportToAppModule(appPath, 'SideNavInnerToolbarModule', './layouts'),
      addImportToAppModule(appPath, 'FooterModule', `./shared/components/footer/footer.component`),
      addStyles(appPath),
      addBuildThemeScript(),
      addCustomThemeStyles(options, rootPath),
      addViewportToRoot(appPath),
      addPackagesToDependency()
    ];

    if (!options.skipInstall) {
      rules.push((_: Tree, context: SchematicContext) => {
        context.addTask(new NodePackageInstallTask());
      });
    }

    if (override) {
      rules.push(overrideContentInFile(appPath + 'app.component.html',
        appComponentContent.replace('layoutName', layout)));
      rules.push(overrideContentInFile('e2e/src/app.e2e-spec.ts', e2eTestContet.replace('appName', project)));
      rules.push(overrideContentInFile('e2e/src/app.po.ts', testUtilsContent));
    }

    if (!hasRoutingModule(host, appPath)) {
      rules.push(addImportToAppModule(appPath, 'AppRoutingModule', './app-routing.module'));
    }

    if (existsSync('./angular.json')) {
      buildThemes();
    }

    return chain(rules);
  };
}
