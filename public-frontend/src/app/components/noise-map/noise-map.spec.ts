import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoiseMapComponent } from './noise-map';

describe('NoiseMap', () => {
  let component: NoiseMapComponent;
  let fixture: ComponentFixture<NoiseMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoiseMapComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NoiseMapComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
