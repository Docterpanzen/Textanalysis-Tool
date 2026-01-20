import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { Textanalyse } from './textanalyse';

describe('Textanalyse', () => {
  let component: Textanalyse;
  let fixture: ComponentFixture<Textanalyse>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Textanalyse],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Textanalyse);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
