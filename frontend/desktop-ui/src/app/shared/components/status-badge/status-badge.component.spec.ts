import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let component: StatusBadgeComponent;
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('renders Normal badge with correct label and class', () => {
    fixture.componentRef.setInput('status', 'normal');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(component.label()).toBe('Normal');
    expect(el.textContent?.trim()).toContain('Normal');
    expect(el.querySelector('.badge-normal')).toBeTruthy();
  });

  it('renders Warning badge with correct label and class', () => {
    fixture.componentRef.setInput('status', 'warning');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(component.label()).toBe('Warning');
    expect(el.textContent?.trim()).toContain('Warning');
    expect(el.querySelector('.badge-warning')).toBeTruthy();
  });

  it('renders Critical badge with correct label and class', () => {
    fixture.componentRef.setInput('status', 'critical');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(component.label()).toBe('Critical');
    expect(el.textContent?.trim()).toContain('Critical');
    expect(el.querySelector('.badge-critical')).toBeTruthy();
  });
});
