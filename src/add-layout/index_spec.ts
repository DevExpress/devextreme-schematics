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
    overrideAppComponent: true
  };

  const schematicRunner = new SchematicTestRunner('@schematics/angular', require.resolve('../../node_modules/@schematics/angular/collection.json'));
  let appTree: UnitTestTree;


  beforeEach(() => {
    appTree = schematicRunner.runSchematic('workspace', workspaceOptions);
    appTree = schematicRunner.runSchematic('application', appOptions, appTree);
  });

  it('should add layout with override', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('add-layout', options, appTree);

    expect(tree.files).toContain('/devextreme.json');
    expect(tree.files).toContain('/testApp/src/app/app-navigation.ts');
    expect(tree.files).toContain('/testApp/src/app/shared/components/header/header.component.ts');
    expect(tree.files).toContain('/testApp/src/app/shared/components/login-form/login-form.component.ts');
    expect(tree.files).toContain('/testApp/src/app/shared/components/navigation-menu/navigation-menu.component.ts');
    expect(tree.files).toContain('/testApp/src/app/layouts/side-nav-outer-toolbar/layout.component.ts');
    expect(tree.files).toContain('/testApp/src/themes/metadata.base.json');
    expect(tree.files).toContain('/testApp/src/themes/metadata.additional.json');

    const devextremeConfigContent = tree.readContent('/devextreme.json');
    expect(devextremeConfigContent).toMatch(/"applicationEngine": "angular"/);

    const componentContent = tree.readContent('/testApp/src/app/app.component.html');
    expect(componentContent).toMatch(/<app-layout #layout>/);

    const stylesContent = tree.readContent('/testApp/src/styles.scss');
    expect(stylesContent).toMatch(/html, body {/);

    const angularContent = JSON.parse(tree.readContent('/angular.json'));
    const styles = angularContent.projects.testApp.architect.build.options.styles;

    expect(styles[0]).toBe('node_modules/devextreme/dist/css/dx.common.css');
    expect(styles[1]).toBe('./src/themes/generated/theme.additional.css');
    expect(styles[2]).toBe('./src/themes/generated/theme.base.css');

    const moduleContent = tree.readContent('/testApp/src/app/app.module.ts');
    expect(moduleContent).toMatch(/import { AppLayoutModule }/);
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

    options.overrideAppComponent = false;
    const tree = runner.runSchematic('add-layout', options, appTree);

    expect(tree.files).toContain('/testApp/src/app/app1.component.ts');

    const componentContent = tree.readContent('/testApp/src/app/app1.component.html');
    expect(componentContent).toMatch(/<app-layout #layout>/);
  });

  it('should add routing to layout', () => {

    let newAppTree = schematicRunner.runSchematic('workspace', workspaceOptions);

    appOptions.routing = false;
    newAppTree = schematicRunner.runSchematic('application', appOptions, newAppTree);

    const runner = new SchematicTestRunner('schematics', collectionPath);

    const tree = runner.runSchematic('add-layout', options, appTree);

    expect(tree.files).toContain('/testApp/src/app/app-routing.module.ts');
  });
});
