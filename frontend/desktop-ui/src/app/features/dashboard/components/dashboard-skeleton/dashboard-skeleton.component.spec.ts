import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardSkeletonComponent } from './dashboard-skeleton.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('DashboardSkeletonComponent', () => {
  let component: DashboardSkeletonComponent;
  let fixture: ComponentFixture<DashboardSkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardSkeletonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardSkeletonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('instantiates and renders skeleton placeholder cards', () => {
    expect(component).toBeTruthy();
    const el = fixture.nativeElement as HTMLElement;
    const skeletons = el.querySelectorAll('.skeleton-card');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
