import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';
import * as path from 'path';

import { modifyJSONFile } from '../utility/modify-json-file';

const collectionPath = path.join(__dirname, '../collection.json');

describe('layout', () => {
  const appOptions: any = {
    name: 'testApp',
    inlineStyle: false,
    inlineTemplate: false,
    routing: true,
    style: 'scss',
    skipTests: false,
    skipPackageJson: false
  };

  const workspaceOptions: WorkspaceOptions = {
    name: 'workspace',
    version: '6.0.0'
  };

  const options: any = {
    layouts: 'side-nav-outer-toolbar',
    resolveConflicts: 'override'
  };

  const angularSchematicsCollection = require.resolve('../../node_modules/@schematics/angular/collection.json');
  const schematicRunner = new SchematicTestRunner('@schematics/angular', angularSchematicsCollection);
  let appTree: UnitTestTree;

  beforeEach(() => {
    appTree = schematicRunner.runSchematic('workspace', workspaceOptions);
    appTree = schematicRunner.runSchematic('application', appOptions, appTree);
  });

  it('should add layout with override', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('add-layout', options, appTree);

    expect(tree.files)
      .toContain('/devextreme.json');
    expect(tree.files)
      .toContain('/testApp/src/app/app-navigation.ts');
    expect(tree.files)
      .toContain('/testApp/src/app/shared/components/header/header.component.ts');
    expect(tree.files)
      .toContain('/testApp/src/app/shared/components/login-form/login-form.component.ts');
    expect(tree.files)
      .toContain('/testApp/src/app/shared/components/side-navigation-menu/side-navigation-menu.component.ts');
    expect(tree.files)
      .toContain('/testApp/src/app/layouts/side-nav-outer-toolbar/side-nav-outer-toolbar.component.ts');
    expect(tree.files)
      .toContain('/testApp/src/themes/metadata.base.json');
    expect(tree.files)
      .toContain('/testApp/src/themes/metadata.additional.json');

    const devextremeConfigContent = tree.readContent('/devextreme.json');
    expect(devextremeConfigContent).toMatch(/"applicationEngine": "angular"/);
    expect(devextremeConfigContent).toMatch(/"inputFile": "\/testApp\/src\/themes\/metadata.additional.json"/);

    const componentContent = tree.readContent('/testApp/src/app/app.component.html');
    expect(componentContent).toMatch(/app-side-nav-outer-toolbar title={{title}}/);

    const stylesContent = tree.readContent('/testApp/src/styles.scss');
    expect(stylesContent).toMatch(/html, body {/);

    const indexContent = tree.readContent('/testApp/src/index.html');
    expect(indexContent).toMatch(/<app-root class="dx-viewport">/);

    const angularContent = JSON.parse(tree.readContent('/angular.json'));
    const styles = angularContent.projects.testApp.architect.build.options.styles;

    expect(styles[0]).toBe('node_modules/devextreme/dist/css/dx.common.css');
    expect(styles[1]).toBe('/testApp/src/themes/generated/theme.additional.css');
    expect(styles[2]).toBe('/testApp/src/themes/generated/theme.base.css');

    const moduleContent = tree.readContent('/testApp/src/app/app.module.ts');
    expect(moduleContent).toMatch(/import { SideNavOuterToolbarModule, SideNavInnerToolbarModule }/);
    expect(moduleContent).toMatch(/import { AppRoutingModule }/);

    const testContent = tree.readContent('/e2e/src/app.e2e-spec.ts');
    expect(testContent).toMatch(/'Welcome to TestApp!'/);

    const testUtilsContent = tree.readContent('/e2e/src/app.po.ts');
    expect(testUtilsContent).toMatch(/'app-root .dx-drawer-content .dx-card p:nth-child\(2\)'/);

    const appContent = tree.readContent('/testApp/src/app/app.component.ts');
    expect(appContent).toMatch(/templateUrl: '.\/app.component.html',/);
    expect(appContent).toMatch(/styleUrls: \['.\/app.component.scss'\]/);
    expect(appContent).toMatch(/title = 'TestApp';/);
  });

  it('should add npm scripts', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('add-layout', options, appTree);
    const packageConfig = JSON.parse(tree.readContent('package.json'));
    expect(packageConfig.scripts['build-themes']).toBe('devextreme build');
    expect(packageConfig.scripts['postinstall']).toBe('npm run build-themes');
  });

  it('should add npm scripts safely', () => {
    modifyJSONFile(appTree, './package.json', config => {
      const scripts = config['scripts'];

      scripts['build-themes'] = 'prev value 1';
      scripts['postinstall'] = 'prev value 2';

      return config;
    });

    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('add-layout', options, appTree);
    const packageConfig = JSON.parse(tree.readContent('package.json'));
    expect(packageConfig.scripts['origin-build-themes']).toBe('prev value 1');
    expect(packageConfig.scripts['origin-postinstall']).toBe('prev value 2');
    expect(packageConfig.scripts['build-themes']).toBe('npm run origin-build-themes && devextreme build');
    expect(packageConfig.scripts['postinstall']).toBe('npm run origin-postinstall && npm run build-themes');
  });

  it('should add angular/cdk dependency', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('add-layout', options, appTree);
    const packageConfig = JSON.parse(tree.readContent('package.json'));

    expect(packageConfig.dependencies['@angular/cdk']).toBeDefined();
  });

  it('should update budgets if updateBudgets option is true', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('add-layout', {
      ...options,
      updateBudgets: true
    }, appTree);

    const angularContent = JSON.parse(tree.readContent('/angular.json'));
    const budgets = angularContent.projects.testApp.architect.build.configurations.production.budgets;

    expect(budgets.length).toBe(1);
    expect(budgets[0]).toEqual({
      type: 'initial',
      maximumWarning: '4mb',
      maximumError: '6mb'
    });
  });

  it('should not update budgets if updateBudgets option is not defined or false', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('add-layout', options, appTree);

    const angularContent = JSON.parse(tree.readContent('/angular.json'));
    const budgets = angularContent.projects.testApp.architect.build.configurations.production.budgets;
    const defaultBudget = {
      type: 'initial',
      maximumWarning: '2mb',
      maximumError: '5mb'
    };

    expect(budgets.length).toBe(1);
    expect(budgets[0]).toEqual(defaultBudget);
  });

  it('should add layout without override', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);

    options.resolveConflicts = 'createNew';
    const tree = runner.runSchematic('add-layout', options, appTree);

    expect(tree.files).toContain('/testApp/src/app/app1.component.ts');

    const componentContent = tree.readContent('/testApp/src/app/app1.component.html');
    expect(componentContent).toMatch(/app-side-nav-outer-toolbar title={{title}}/);

    const appContent = tree.readContent('/testApp/src/app/app.component.ts');
    expect(appContent).toMatch(/templateUrl: '.\/app.component.html',/);
    expect(appContent).toMatch(/styleUrls: \['.\/app.component.scss'\]/);

    const newAppContent = tree.readContent('/testApp/src/app/app1.component.ts');
    expect(newAppContent).toMatch(/templateUrl: '.\/app1.component.html',/);
    expect(newAppContent).toMatch(/styleUrls: \['.\/app1.component.scss'\]/);
    expect(newAppContent).toMatch(/title = 'TestApp';/);
  });

  it('should add routing to layout', () => {

    let newAppTree = schematicRunner.runSchematic('workspace', workspaceOptions);

    appOptions.routing = false;
    newAppTree = schematicRunner.runSchematic('application', appOptions, newAppTree);

    const runner = new SchematicTestRunner('schematics', collectionPath);

    const tree = runner.runSchematic('add-layout', options, appTree);

    expect(tree.files).toContain('/testApp/src/app/app-routing.module.ts');
  });

  it('should use selected layout', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    options.layout = 'side-nav-inner-toolbar';
    options.resolveConflicts = 'override';
    const tree = runner.runSchematic('add-layout', options, appTree);
    const content = tree.readContent('/testApp/src/app/app.component.html');

    expect(content).toMatch(/app-side-nav-inner-toolbar title={{title}}/);
  });

  it('should consider the `project` option', () => {
    appTree = schematicRunner.runSchematic('application', {
      ...appOptions,
      name: 'testApp2',
      projectRoot: 'projects/testApp2'
    }, appTree);

    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('add-layout', {
      ...options,
      project: 'testApp2'
    }, appTree);

    expect(tree.files)
      .toContain('/devextreme.json');
    expect(tree.files)
      .toContain('/projects/testApp2/src/themes/metadata.base.json');
  });

  it('should merge build commands in devextreme.json file', () => {
    appTree = schematicRunner.runSchematic('application', {
      ...appOptions,
      name: 'testApp2',
      projectRoot: 'projects/testApp2'
    }, appTree);

    const runner = new SchematicTestRunner('schematics', collectionPath);
    let tree = runner.runSchematic('add-layout', options, appTree);
    tree = runner.runSchematic('add-layout', {
      ...options,
      project: 'testApp2'
    }, appTree);

    const content = tree.readContent('/devextreme.json');
    expect(content).toContain('"inputFile": "/testApp/src/themes/metadata.base.json",');
    expect(content).toContain('"inputFile": "projects/testApp2/src/themes/metadata.base.json",');
  });

  it('should add e2e tests only for default project', () => {
    appTree = schematicRunner.runSchematic('application', {
      ...appOptions,
      name: 'testApp2',
      projectRoot: 'projects/testApp2'
    }, appTree);

    const runner = new SchematicTestRunner('schematics', collectionPath);
    let tree = runner.runSchematic('add-layout', options, appTree);
    tree = runner.runSchematic('add-layout', {
      ...options,
      project: 'testApp2'
    }, appTree);

    const testContent = tree.readContent('/e2e/src/app.e2e-spec.ts');
    expect(testContent).toContain('Welcome to TestApp!');

    const testUtilsContent = tree.readContent('/e2e/src/app.po.ts');
    expect(testUtilsContent).toMatch(/'app-root .dx-drawer-content .dx-card p:nth-child\(2\)'/);
  });
});
