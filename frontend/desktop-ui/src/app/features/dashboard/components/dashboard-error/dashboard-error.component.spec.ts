import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardErrorComponent } from './dashboard-error.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('DashboardErrorComponent', () => {
  let component: DashboardErrorComponent;
  let fixture: ComponentFixture<DashboardErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardErrorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders default error message', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Unable to retrieve telemetry data');
  });

  it('renders custom error message when input is provided', () => {
    fixture.componentRef.setInput('message', 'Custom gateway connection timeout.');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Custom gateway connection timeout.');
  });

  it('emits retry output when retry button is clicked or onRetry() is called', () => {
    const retrySpy = vi.fn();
    component.retry.subscribe(retrySpy);

    component.onRetry();
    expect(retrySpy).toHaveBeenCalledTimes(1);
  });
});
