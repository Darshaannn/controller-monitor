import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CircularGaugeComponent } from './circular-gauge.component';

describe('CircularGaugeComponent', () => {
  let component: CircularGaugeComponent;
  let fixture: ComponentFixture<CircularGaugeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircularGaugeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CircularGaugeComponent);
    component = fixture.componentInstance;
  });

  it('calculates 0% progress when value equals min', () => {
    fixture.componentRef.setInput('value', 0);
    fixture.componentRef.setInput('min', 0);
    fixture.componentRef.setInput('max', 100);
    fixture.detectChanges();

    expect(component.normalizedProgress()).toBe(0);
  });

  it('calculates 50% progress for midpoint', () => {
    fixture.componentRef.setInput('value', 50);
    fixture.componentRef.setInput('min', 0);
    fixture.componentRef.setInput('max', 100);
    fixture.detectChanges();

    expect(component.normalizedProgress()).toBe(0.5);
  });

  it('calculates 100% progress when value equals max', () => {
    fixture.componentRef.setInput('value', 100);
    fixture.componentRef.setInput('min', 0);
    fixture.componentRef.setInput('max', 100);
    fixture.detectChanges();

    expect(component.normalizedProgress()).toBe(1.0);
  });

  it('clamps values below min or above max safely', () => {
    fixture.componentRef.setInput('value', -50);
    fixture.componentRef.setInput('min', 0);
    fixture.componentRef.setInput('max', 100);
    fixture.detectChanges();
    expect(component.normalizedProgress()).toBe(0);

    fixture.componentRef.setInput('value', 150);
    fixture.detectChanges();
    expect(component.normalizedProgress()).toBe(1.0);
  });

  it('handles invalid inputs and equal min/max safely without NaN', () => {
    fixture.componentRef.setInput('value', 50);
    fixture.componentRef.setInput('min', 50);
    fixture.componentRef.setInput('max', 50);
    fixture.detectChanges();
    expect(component.normalizedProgress()).toBe(0);

    fixture.componentRef.setInput('value', NaN);
    fixture.detectChanges();
    expect(component.normalizedProgress()).toBe(0);
    expect(component.formattedValue()).toBe('--');
  });

  it('renders accessibility meter attributes correctly', () => {
    fixture.componentRef.setInput('value', 185.4);
    fixture.componentRef.setInput('min', 0);
    fixture.componentRef.setInput('max', 300);
    fixture.componentRef.setInput('unit', 'cm/s');
    fixture.componentRef.setInput('label', 'Velocity');
    fixture.componentRef.setInput('status', 'normal');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const container = el.querySelector('.circular-gauge-container');
    expect(container?.getAttribute('role')).toBe('meter');
    expect(container?.getAttribute('aria-valuenow')).toBe('185.4');
    expect(container?.getAttribute('aria-valuemin')).toBe('0');
    expect(container?.getAttribute('aria-valuemax')).toBe('300');
    expect(container?.getAttribute('aria-label')).toBe('Velocity');
  });
});
