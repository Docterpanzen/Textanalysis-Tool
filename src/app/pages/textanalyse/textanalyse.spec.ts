import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Textanalyse } from './textanalyse';

describe('Textanalyse', () => {
  let component: Textanalyse;
  let fixture: ComponentFixture<Textanalyse>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Textanalyse]
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
