export interface AdminSearchResult {
  id: number;
  type: 'candidate' | 'employer' | 'job';
  name?: string;
  email?: string;
  qualification?: string;
  experience?: string | { years: number };
  city?: string;
  status:
    | 'verified'
    | 'pending'
    | 'rejected'
    | 'active'
    | 'fulfilled'
    | 'dormant'
    | 'onHold';
  avatar?: string;
  companyName?: string;
  industry?: string;
  size?: string;
  logo?: string;
  title?: string;
  employer?: string;
  employerId?: number;
  postedOn?: string;
  category?: string;
  experienceRequired?: string;
}
