import { Component, OnInit } from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import {Observable, of} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {catchError, debounceTime, distinctUntilChanged, first, map, switchMap, tap} from 'rxjs/operators';

@Component({
  selector: 'app-profile-editor',
  templateUrl: './profile-editor.component.html',
  styleUrls: ['./profile-editor.component.css']
})
export class ProfileEditorComponent implements OnInit {
  profileForm = this.fb.group({
    firstName: ['', [this.forbiddenNameValidator(/bob/i)]],
    lastName: [''],
    email: ['', [Validators.required, Validators.email], [this.validateAsyncEmail.bind(this)]],
    address: this.fb.group({
      street: [''],
      city: [''],
      zip: ['']
    }),
    aliases: this.fb.array([
      this.fb.control('')
    ])
  }, {validators: sameNamesValidator});

  constructor(private fb: FormBuilder, private http: HttpClient) { }

  get aliases(): FormArray {
    return this.profileForm.get('aliases') as FormArray;
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
    // Check emails on submit click solution
    // this.http.get('http://localhost:3000/emails').pipe(
    //   map((emails: string[]) => {
    //     const emailExists = emails.includes(this.profileForm.get('email').value);
    //     this.profileForm.get('email').setErrors(emailExists ? {emailTaken: true} : null);
    //     return emailExists;
    //   })
    // ).subscribe(errorExists => {
    //   if(errorExists) {
    //     this.router.navigate(['/dashboard']);
    //   }
    // });
  }

  validateAsyncEmail(control: AbstractControl): Observable<ValidationErrors | null> {
    return control.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(() => this.http.get('http://localhost:3000/emails')),
      map((emails: string[]) => emails.includes(control.value) ? {emailTaken: true} : null),
      catchError(() => of(null)),
      first()
    );
  }

  private forbiddenNameValidator(regExp: RegExp): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const forbidden = regExp.test(control.value);
      return forbidden ? {forbiddenName: {value: `You can't be Bob`}} : null;
    };
  }
}

const sameNamesValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const firstName = control.get('firstName');
  const lastName = control.get('lastName');

  return firstName.value && lastName.value && firstName.value === lastName.value ? { sameNames: true } : null;
};
