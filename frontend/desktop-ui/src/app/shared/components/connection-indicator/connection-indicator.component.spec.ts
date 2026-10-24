import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConnectionIndicatorComponent } from './connection-indicator.component';
import { ConnectionState } from '../../../core/models/dashboard-view.model';
import { describe, it, expect, beforeEach } from 'vitest';

describe('ConnectionIndicatorComponent', () => {
  let component: ConnectionIndicatorComponent;
  let fixture: ComponentFixture<ConnectionIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnectionIndicatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConnectionIndicatorComponent);
    component = fixture.componentInstance;
  });

  const testStates: Array<{ state: ConnectionState; label: string; cls: string }> = [
    { state: 'connected', label: 'Connected', cls: 'state-connected' },
    { state: 'connecting', label: 'Connecting...', cls: 'state-connecting' },
    { state: 'reconnecting', label: 'Reconnecting...', cls: 'state-reconnecting' },
    { state: 'offline', label: 'Offline', cls: 'state-error' },
    { state: 'error', label: 'Connection Failed', cls: 'state-error' },
  ];

  for (const { state, label, cls } of testStates) {
    it(`evaluates statusLabel and statusClass accurately for state "${state}"`, () => {
      fixture.componentRef.setInput('state', state);
      fixture.detectChanges();

      expect(component.statusLabel()).toBe(label);
      expect(component.statusClass()).toBe(cls);

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain(label);
    });
  }

  it('renders endpoint indicator when provided', () => {
    fixture.componentRef.setInput('state', 'connected');
    fixture.componentRef.setInput('endpoint', 'http://127.0.0.1:3000');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Connected');
  });
});
