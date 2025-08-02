import { describe, it, expect, vi, beforeEach } from 'vitest';


var whereMock: any;
var callIndex = 0;

vi.mock('../../db', () => {

  const data = [
    { id: 1, employerId: 1, jobStatus: 'PENDING', deleted: false },
    { id: 2, employerId: 1, jobStatus: 'PENDING', deleted: true },
    { id: 3, employerId: 2, jobStatus: 'PENDING', deleted: false },
  ];
  whereMock = vi.fn(() => {
    const current = callIndex++;
    let result;

    if (current === 0) {
      result = data.filter((j) => j.employerId === 1 && !j.deleted);
    } else if (current === 1) {
      result = data.filter((j) => j.jobStatus === 'PENDING' && !j.deleted);
    } else {
      result = data.filter((j) => !j.deleted);
    }
    return result;
  });
  const fromMock = vi.fn(() => ({ where: whereMock }));
  const selectMock = vi.fn(() => ({ from: fromMock }));
  return { db: { select: selectMock }, whereMock };
});

import { whereMock as dbWhereMock } from '../../db';
import { JobRepository } from '../JobRepository';

describe('JobRepository soft delete filters', () => {
  beforeEach(() => {
    dbWhereMock.mockClear();
  });

  it('getJobPostsByEmployer should filter deleted jobs', async () => {
    const jobs = await JobRepository.getJobPostsByEmployer(1);
    expect(jobs.length).toBe(1);
    expect(jobs[0].id).toBe(1);
  });

  it('getInactiveJobs should filter deleted jobs', async () => {
    const jobs = await JobRepository.getInactiveJobs();
    expect(jobs.every(j => !j.deleted)).toBe(true);
  });

  it('getAllJobPosts should filter deleted jobs', async () => {
    const jobs = await JobRepository.getAllJobPosts();
    expect(jobs.every(j => !j.deleted)).toBe(true);
  });
});
