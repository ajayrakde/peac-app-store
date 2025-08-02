export type JobStatus =
  | 'active'
  | 'pending'
  | 'onHold'
  | 'dormant'
  | 'fulfilled'
  | 'deleted';

export type DbJobStatus =
  | 'PENDING'
  | 'ON_HOLD'
  | 'ACTIVE'
  | 'FULFILLED'
  | 'DORMANT';

export type JobAction =
  | 'fulfill'
  | 'activate'
  | 'deactivate'
  | 'hold'
  | 'clone'
  | 'delete'
  | 'edit'
  | 'view'
  | 'apply';

export function getJobStatus({
  jobStatus,
  deleted,
}: {
  jobStatus?: string;
  deleted?: boolean;
}): JobStatus {
  if (deleted) return 'deleted';
  switch (jobStatus) {
    case 'ACTIVE':
      return 'active';
    case 'ON_HOLD':
      return 'onHold';
    case 'FULFILLED':
      return 'fulfilled';
    case 'DORMANT':
      return 'dormant';
    default:
      return 'pending';
  }
}

export function isValidTransition(
  current: DbJobStatus,
  target: DbJobStatus,
  deleted = false,
): boolean {
  if (deleted) return false;
  if (current === target) return true;
  const transitions: Record<DbJobStatus, DbJobStatus[]> = {
    PENDING: ['ON_HOLD', 'ACTIVE'],
    ON_HOLD: ['ACTIVE'],
    ACTIVE: ['DORMANT', 'FULFILLED'],
    DORMANT: ['ACTIVE'],
    FULFILLED: [],
  };
  return transitions[current]?.includes(target) ?? false;
}

export function canPerformAction(
  role: string,
  status: DbJobStatus,
  action: JobAction,
  deleted = false,
): boolean {
  if (deleted) return false;

  if (role === 'candidate') {
    return ['view', 'apply'].includes(action) && status === 'ACTIVE';
  }

  if (role === 'employer') {
    const rules: Record<DbJobStatus, JobAction[]> = {
      PENDING: ['clone', 'edit'],
      ON_HOLD: ['clone', 'edit'],
      DORMANT: ['clone', 'activate'],
      ACTIVE: ['clone', 'edit', 'fulfill'],
      FULFILLED: ['clone'],
    };
    return rules[status]?.includes(action) ?? false;
  }

  if (role === 'admin') {
    const rules: Record<DbJobStatus, JobAction[]> = {
      PENDING: ['delete', 'clone', 'edit', 'activate', 'hold'],
      ON_HOLD: ['delete', 'clone', 'edit', 'activate'],
      ACTIVE: ['delete', 'clone', 'edit', 'fulfill'],
      DORMANT: ['delete', 'clone', 'activate'],
      FULFILLED: ['delete', 'clone', 'activate'],
    };
    return rules[status]?.includes(action) ?? false;
  }

  return false;
}
