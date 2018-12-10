import {
  Rule,
  SchematicContext,
  Tree,
  apply,
  url,
  move,
  chain,
  filter,
  forEach,
  mergeWith,
  callRule,
  FileEntry,
  template
} from '@angular-devkit/schematics';

import { of } from 'rxjs';

import { strings } from '@angular-devkit/core';

import { join, basename } from 'path';

import {
  getApplicationPath,
  getSourceRootPath,
  getProjectName
 } from '../utility/project';

import {
  humanize
} from '../utility/string';

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
  addImportToModule, addProviderToModule
} from '@schematics/angular/utility/ast-utils';

import {
  applyChanges
} from '../utility/change';
import { getWorkspace } from '@schematics/angular/utility/config';

const projectFilesSource = './files/src';
const workspaceFilesSource = './files';

function addScriptSafe(scripts: any, name: string, value: string) {
  const currentValue = scripts[name];

  if (!currentValue) {
    scripts[name] = value;
    return;
  }

  const alterName = `origin-${name}`;
  const safeValue = `npm run ${alterName} && ${value}`;

  if (currentValue === value || currentValue === safeValue) {
    return;
  }

  scripts[alterName] = currentValue;
  scripts[name] = safeValue;
}

function addBuildThemeScript() {
  return (host: Tree) => {
    modifyJSONFile(host, './package.json', config => {
      const scripts = config['scripts'];

      addScriptSafe(scripts, 'build-themes', 'devextreme build');
      addScriptSafe(scripts, 'postinstall', 'npm run build-themes');

      return config;
    });

    return host;
  };
}

function addCustomThemeStyles(options: any, sourcePath: string) {
  return (host: Tree) => {
    modifyJSONFile(host, './angular.json', config => {
      const stylesList = [
        `${sourcePath}/dx-styles.scss`,
        `${sourcePath}/themes/generated/theme.additional.css`,
        `${sourcePath}/themes/generated/theme.base.css`,
        'node_modules/devextreme/dist/css/dx.common.css'
      ];

      return addStylesToApp(host, options.project, config, stylesList);
    });

    return host;
  };
}

function updateBudgets(options: any) {
  return (host: Tree) => {
    modifyJSONFile(host, './angular.json', config => {
      const projectName = getProjectName(host, options.project);
      const budgets: any[] = config.projects[projectName].architect.build.configurations.production.budgets;

      const budget = budgets.find((item) => item.type === 'initial');
      if (budget) {
        budget.maximumWarning = '4mb';
        budget.maximumError = '6mb';
      }

      return config;
    });

    return host;
  };
}

function addViewportToBody(sourcePath: string) {
  return (host: Tree) => {
    const indexPath =  join(sourcePath, 'index.html');
    let indexContent = host.read(indexPath)!.toString();

    indexContent = indexContent.replace(/<body>/, '<body class="dx-viewport">');
    host.overwrite(indexPath, indexContent);

    return host;
  };
}

function addImportToAppModule(sourcePath: string, importName: string, path: string) {
  return (host: Tree) => {
    const appModulePath = sourcePath + 'app.module.ts';
    const source = getSourceFile(host, appModulePath);

    if (!source) {
      return host;
    }

    const changes = addImportToModule(source, appModulePath, importName, path);

    return applyChanges(host, changes, appModulePath);
  };
}

function addProviderToAppModule(sourcePath: string, importName: string, path: string) {
  return (host: Tree) => {
    const appModulePath = sourcePath + 'app.module.ts';
    const source = getSourceFile(host, appModulePath);

    if (!source) {
      return host;
    }

    const changes = addProviderToModule(source, appModulePath, importName, path);

    return applyChanges(host, changes, appModulePath);
  };
}

function getComponentName(host: Tree, sourcePath: string) {
  let name = '';
  const index = 1;

  if (!host.exists(sourcePath + 'app.component.ts')) {
    name = 'app';
  }

  while (!name) {
    const componentName = `app${index}`;
    if (!host.exists(`${sourcePath}${componentName}.component.ts`)) {
      name = componentName;
    }
  }

  return name;
}

function hasRoutingModule(host: Tree, sourcePath: string) {
  return host.exists(sourcePath + 'app-routing.module.ts');
}

function addPackagesToDependency() {
  return (host: Tree) => {
    addPackageJsonDependency(host, {
      type: NodeDependencyType.Default,
      name: '@angular/cdk',
      version: '^7.0.0'
    });

    return host;
  };
}

function modifyContentByTemplate(
  sourcePath: string,
  templateSourcePath: string,
  filePath: string | null,
  templateOptions: any = {},
  modifyContent?: (templateContent: string, currentContent: string, filePath: string ) => string)
: Rule {
  return(host: Tree, context: SchematicContext) => {
    const modifyIfExists = (fileEntry: FileEntry) => {
      const fileEntryPath = join(sourcePath, fileEntry.path.toString());
      if (!host.exists(fileEntryPath)) {
        return fileEntry;
      }

      const templateContent = fileEntry.content!.toString();
      let modifiedContent = templateContent;

      if (modifyContent) {
        const currentContent = host.read(fileEntryPath)!.toString();
        modifiedContent = modifyContent(templateContent, currentContent, fileEntryPath);
      }

      // NOTE: Workaround for https://github.com/angular/angular-cli/issues/11337
      host.overwrite(fileEntryPath,  modifiedContent);
      return null;
    };

    const rules = [
      filter(path => {
        return !filePath || join('./', path) === join('./', filePath);
      }),
      template(templateOptions),
      forEach(modifyIfExists),
      move(sourcePath)
    ];

    const modifiedSource = apply(url(templateSourcePath), rules);
    const resultRule = mergeWith(modifiedSource);

    return callRule(resultRule, of(host), context);
  };
}

function updateDevextremeConfig(sourcePath: string) {
  const devextremeConfigPath = '/devextreme.json';
  const templateOptions = {
    engine: 'angular',
    sourcePath
  };

  const modifyConfig = (templateContent: string, currentContent: string) => {
    const oldConfig = JSON.parse(currentContent);
    const newConfig = JSON.parse(templateContent);

    [].push.apply(oldConfig.build.commands, newConfig.build.commands);

    return JSON.stringify(oldConfig, null, '   ');
  };

  return modifyContentByTemplate('./', workspaceFilesSource, devextremeConfigPath, templateOptions, modifyConfig);
}

export default function(options: any): Rule {
  return (host: Tree) => {
    const project = getProjectName(host, options.project);
    const title = humanize(project);
    const appPath = getApplicationPath(host, project);
    const sourcePath = getSourceRootPath(host, project);
    const layout = options.layout;
    const override = options.resolveConflicts === 'override';
    const componentName = override ? 'app' : getComponentName(host, appPath);
    const pathToCss = sourcePath.replace(/\/?(\w)+\/?/g, '../');
    const templateOptions = { name: componentName, layout, title, strings, path: pathToCss };

    const modifyContent = (templateContent: string, currentContent: string, filePath: string) => {
      if (basename(filePath) === 'styles.scss') {
        return `${currentContent}\n${templateContent}`;
      }

      if (basename(filePath) === 'app-routing.module.ts' && hasRoutingModule(host, appPath)) {
        return currentContent;
      }

      return templateContent;
    };

    const rules = [
      modifyContentByTemplate(sourcePath, projectFilesSource, null, templateOptions, modifyContent),
      updateDevextremeConfig(sourcePath),
      addImportToAppModule(appPath, 'SideNavOuterToolbarModule', './layouts'),
      addImportToAppModule(appPath, 'SideNavInnerToolbarModule', './layouts'),
      addImportToAppModule(appPath, 'SingleCardModule', './layouts'),
      addImportToAppModule(appPath, 'FooterModule', './shared/components'),
      addImportToAppModule(appPath, 'LoginFormModule', './shared/components'),
      addProviderToAppModule(appPath, 'AuthService', './shared/services'),
      addProviderToAppModule(appPath, 'ScreenService', './shared/services'),
      addProviderToAppModule(appPath, 'AppInfoService', './shared/services'),
      addBuildThemeScript(),
      addCustomThemeStyles(options, sourcePath),
      addViewportToBody(sourcePath),
      addPackagesToDependency()
    ];

    if (options.updateBudgets) {
      rules.push(updateBudgets(options));
    }

    if (!options.skipInstall) {
      rules.push((_: Tree, context: SchematicContext) => {
        context.addTask(new NodePackageInstallTask());
      });
    }

    if (override) {
      const workspace = getWorkspace(host);
      if (project === workspace.defaultProject) {
        rules.push(modifyContentByTemplate('./', workspaceFilesSource, 'e2e/src/app.e2e-spec.ts', { title }));
        rules.push(modifyContentByTemplate('./', workspaceFilesSource, 'e2e/src/app.po.ts'));
      }
    }

    if (!hasRoutingModule(host, appPath)) {
      rules.push(addImportToAppModule(appPath, 'AppRoutingModule', './app-routing.module'));
    }

    return chain(rules);
  };
}
