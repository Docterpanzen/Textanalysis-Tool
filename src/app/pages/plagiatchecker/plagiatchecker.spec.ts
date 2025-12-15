import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Plagiatchecker } from './plagiatchecker';

describe('Plagiatchecker', () => {
  let component: Plagiatchecker;
  let fixture: ComponentFixture<Plagiatchecker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Plagiatchecker]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Plagiatchecker);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
