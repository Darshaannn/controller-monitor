import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TelemetryCardComponent } from './telemetry-card.component';
import { TelemetryPanelViewModel } from '../../../../core/models/dashboard-view.model';
import { SUPPORTED_UNITS } from '../../../../core/utilities/unit-conversion.util';

describe('TelemetryCardComponent', () => {
  let component: TelemetryCardComponent;
  let fixture: ComponentFixture<TelemetryCardComponent>;

  const mockModel: TelemetryPanelViewModel = {
    key: 'velocity',
    label: 'Velocity',
    canonicalValue: 185.4,
    canonicalUnit: 'cm/s',
    displayValue: 185.4,
    displayUnit: 'cm/s',
    supportedUnits: SUPPORTED_UNITS.velocity,
    baseline: 185.4,
    gaugeMin: 0,
    gaugeMax: 300,
    status: 'normal',
    lastUpdated: '12:00:00',
    history: [{ time: '12:00:00', value: 185.4 }],
    description: 'Controller linear motion rate',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelemetryCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TelemetryCardComponent);
    component = fixture.componentInstance;
  });

  it('renders metric label, unit, and baseline accurately', () => {
    fixture.componentRef.setInput('model', mockModel);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Velocity');
    expect(el.textContent).toContain('185.4');
    expect(el.textContent).toContain('cm/s');
    expect(el.textContent).toContain('0.0%'); // 0% deviation from baseline
  });

  it('computes deviation percentage correctly for warning state', () => {
    const warningModel: TelemetryPanelViewModel = {
      ...mockModel,
      displayValue: 213.21, // +15% deviation
      status: 'warning',
    };

    fixture.componentRef.setInput('model', warningModel);
    fixture.detectChanges();

    expect(component.formattedDeviation()).toBe('+15.0%');
  });

  it('emits unitChange event when a new unit is selected and ignores when same unit selected', () => {
    fixture.componentRef.setInput('model', mockModel);
    fixture.detectChanges();

    let emitted: { key: string; unit: string } | null = null;
    component.unitChange.subscribe((val) => (emitted = val));

    // Selecting same unit should not emit
    component.onUnitSelect('cm/s');
    expect(emitted).toBeNull();
    expect(component.isDropdownOpen()).toBe(false);

    // Selecting different unit emits event
    component.onUnitSelect('km/h');
    expect(emitted).toEqual({ key: 'velocity', unit: 'km/h' });
  });

  it('toggles and closes unit dropdown properly', () => {
    expect(component.isDropdownOpen()).toBe(false);
    component.toggleDropdown();
    expect(component.isDropdownOpen()).toBe(true);
    component.closeDropdown();
    expect(component.isDropdownOpen()).toBe(false);
  });

  it('returns appropriate icon paths for pressure and temperature metrics', () => {
    fixture.componentRef.setInput('model', { ...mockModel, key: 'pressure' });
    fixture.detectChanges();
    expect(component.iconSrc()).toBe('assets/icons/pressure.png');

    fixture.componentRef.setInput('model', { ...mockModel, key: 'temperature' });
    fixture.detectChanges();
    expect(component.iconSrc()).toBe('assets/icons/temperature.png');
  });

  it('handles zero baseline gracefully without division by zero', () => {
    fixture.componentRef.setInput('model', { ...mockModel, baseline: 0 });
    fixture.detectChanges();
    expect(component.deviationPercent()).toBe(0);
    expect(component.formattedDeviation()).toBe('0.0%');
  });
});
