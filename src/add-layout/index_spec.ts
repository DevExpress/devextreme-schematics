import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';
import * as path from 'path';

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

    const componentContent = tree.readContent('/testApp/src/app/app.component.html');
    expect(componentContent).toMatch(/app-side-nav-outer-toolbar title="TestApp"/);

    const stylesContent = tree.readContent('/testApp/src/styles.scss');
    expect(stylesContent).toMatch(/html, body {/);

    const indexContent = tree.readContent('/testApp/src/index.html');
    expect(indexContent).toMatch(/<app-root class="dx-viewport">/);

    const angularContent = JSON.parse(tree.readContent('/angular.json'));
    const styles = angularContent.projects.testApp.architect.build.options.styles;

    expect(styles[0]).toBe('node_modules/devextreme/dist/css/dx.common.css');
    expect(styles[1]).toBe('./src/themes/generated/theme.additional.css');
    expect(styles[2]).toBe('./src/themes/generated/theme.base.css');

    const moduleContent = tree.readContent('/testApp/src/app/app.module.ts');
    expect(moduleContent).toMatch(/import { SideNavOuterToolbarModule, SideNavInnerToolbarModule }/);
    expect(moduleContent).toMatch(/import { AppRoutingModule }/);
  });

  it('should add angular/cdk dependency', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('add-layout', options, appTree);
    const packageConfig = JSON.parse(tree.readContent('package.json'));

    expect(packageConfig.dependencies['@angular/cdk']).toBeDefined();
  });

  it('should add layout without override', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);

    options.resolveConflicts = 'safe';
    const tree = runner.runSchematic('add-layout', options, appTree);

    expect(tree.files).toContain('/testApp/src/app/app1.component.ts');

    const componentContent = tree.readContent('/testApp/src/app/app1.component.html');
    expect(componentContent).toMatch(/app-side-nav-outer-toolbar title="TestApp"/);
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

    expect(content).toMatch(/app-side-nav-inner-toolbar title="TestApp"/);
  });
});
