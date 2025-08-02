import { describe, it, expect } from 'vitest';
import { canPerformAction } from '../jobStatus';

describe('canPerformAction role rules', () => {
  it('employer can edit pending job', () => {
    expect(canPerformAction('employer', 'PENDING', 'edit')).toBe(true);
  });

  it('employer cannot edit fulfilled job', () => {
    expect(canPerformAction('employer', 'FULFILLED', 'edit')).toBe(false);
  });

  it('admin cannot edit fulfilled job', () => {
    expect(canPerformAction('admin', 'FULFILLED', 'edit')).toBe(false);
  });

  it('candidate can apply to active job', () => {
    expect(canPerformAction('candidate', 'ACTIVE', 'apply')).toBe(true);
  });

  it('candidate cannot apply to dormant job', () => {
    expect(canPerformAction('candidate', 'DORMANT', 'apply')).toBe(false);
  });

  it('admin can activate dormant job', () => {
    expect(canPerformAction('admin', 'DORMANT', 'activate')).toBe(true);
  });

  it('employer cannot activate pending or on hold job', () => {
    expect(canPerformAction('employer', 'PENDING', 'activate')).toBe(false);
    expect(canPerformAction('employer', 'ON_HOLD', 'activate')).toBe(false);
    expect(canPerformAction('employer', 'DORMANT', 'activate')).toBe(true);
  });
});
