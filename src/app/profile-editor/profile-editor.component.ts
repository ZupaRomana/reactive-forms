import { Component, OnInit } from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';

import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-profile-editor',
  templateUrl: './profile-editor.component.html',
  styleUrls: ['./profile-editor.component.css']
})
export class ProfileEditorComponent implements OnInit {
  profileForm = this.fb.group({
    firstName: ['', [this.forbiddenNameValidator(/bob/i)]],
    lastName: [''],
    email: ['', [Validators.email], [this.validate.bind(this)]],
    address: this.fb.group({
      street: [''],
      city: [''],
      zip: ['']
    }),
    aliases: this.fb.array([
      this.fb.control('')
    ])
  }, {validators: sameNamesValidator});

  private NAME = 'name';

  constructor(private http: HttpClient, private fb: FormBuilder) { }

  get name(): string {
    return this.NAME;
  }

  get aliases(): FormArray {
    return this.profileForm.get('aliases') as FormArray;
  }

  get controls(): {
    [key: string]: AbstractControl;
  }{
    return this.profileForm.controls;
  }

  addAlias(): void {
    this.aliases.push(this.fb.control(''));
  }

  ngOnInit(): void {
    // pobieramy nazwe z back następnie
    this.profileForm.patchValue({
      firstName: 'Bob',
      address: {
        city: 'Krakow'
      }
    });
  }

  onSubmit(): void {
    console.log(this.profileForm.value);
  }

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    if (this.readyToSendValidation(control)) {
      return this.http.get('http://localhost:3000/emails').pipe(
        map((emails: string[]) => emails.includes(control.value) ? {emailTaken: true} : null),
        catchError(() => of(null))
      );
    }
    return of(null);
  }

  forbiddenNameValidator(nameRe: RegExp): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const forbidden = nameRe.test(control.value);
      return forbidden ? {forbiddenName: {value: 'Cant be bob'}} : null;
    };
  }

  private readyToSendValidation(control: AbstractControl): boolean {
    console.log(control.dirty && control.touched);
    return control.dirty && control.touched;
  }
}

const sameNamesValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const firstName = control.get('firstName');
  const lastName = control.get('lastName');

  return firstName && lastName && firstName.value === lastName.value ? { identityRevealed: true } : null;
};
