import { Component } from '@angular/core';

@Component({
    templateUrl: 'profile.component.html',
    styleUrls: [ './profile.component.scss' ]
})

export class ProfileComponent {
    employee: any;
    colCountByScreen: Object;

    constructor() {
        this.employee = {
            ID: 7,
            FirstName: 'Sandra',
            LastName: 'Johnson',
            Prefix: 'Mrs.',
            Position: 'Controller',
            Picture: 'images/employees/06.png',
            BirthDate: '1974/11/15',
            HireDate: '2005/05/11',
            /* tslint:disable-next-line:max-line-length */
            Notes: 'Sandra is a CPA and has been our controller since 2008. She loves to interact with staff so if yo`ve not met her, be certain to say hi.\r\n\r\nSandra has 2 daughters both of whom are accomplished gymnasts.',
            Address: '4600 N Virginia Rd.'
        };
    }
}
