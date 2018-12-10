import { Component, OnInit, NgModule, Output, Input, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService, AppInfoService } from '../../services';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { DxValidationGroupModule } from 'devextreme-angular/ui/validation-group';

@Component({
    selector: 'app-login-form',
    templateUrl: './login-form.component.html',
    styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent implements OnInit {
    login = '';
    password = '';

    constructor(private authService: AuthService, public appInfo: AppInfoService) { }

    ngOnInit() { }

    onLoginClick(args) {
        if (!args.validationGroup.validate().isValid) {
            return;
        }

        this.authService.logIn(this.login, this.password);

        args.validationGroup.reset();
    }
}
@NgModule({
    imports: [
        CommonModule,
        DxButtonModule,
        DxCheckBoxModule,
        DxTextBoxModule,
        DxValidatorModule,
        DxValidationGroupModule
    ],
    declarations: [ LoginFormComponent ],
    exports: [ LoginFormComponent ]
})
export class LoginFormModule { }