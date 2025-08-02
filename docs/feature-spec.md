# Feature Specification

This document summarizes which features are available based on the current implementation. Features are grouped by user role and whether they are fully implemented, partially implemented or missing entirely.

## Candidate

### Implemented
- Create candidate profile and update details with verification checks【F:server/routes/candidates.ts†L28-L64】
- View own profile information【F:server/routes/candidates.ts†L14-L26】
- Fetch basic statistics such as application count【F:server/routes/candidates.ts†L67-L75】
- List applications submitted by the candidate【F:server/routes/candidates.ts†L87-L95】
- Browse public job listings and view job details【F:server/routes/candidates.ts†L97-L119】
- Apply for a job post after verification【F:server/routes/candidates.ts†L122-L135】

### Partially Implemented
- Recommended jobs endpoint exists but returns an empty list (matching not implemented)【F:server/repositories/CandidateRepository.ts†L246-L250】
- `getCandidateStats` only counts applications—other statistics displayed in the client are placeholders【F:server/repositories/CandidateRepository.ts†L212-L241】

### Not Implemented
- Advanced job search or filtering from the candidate side
- Candidate account deletion or document management

## Employer

### Implemented
- Register employer profile and update information【F:server/routes/employers.ts†L16-L40】【F:server/routes/employers.ts†L99-L126】
- Retrieve statistics for the employer dashboard【F:server/routes/employers.ts†L42-L49】
- List, create and edit job posts【F:server/routes/employers.ts†L52-L98】【F:server/routes/employers.ts†L152-L186】
- Activate, deactivate and mark jobs as fulfilled【F:server/routes/employers.ts†L188-L241】
- View applications for a specific job post【F:server/routes/employers.ts†L245-L257】
- Clone an existing job post【F:server/routes/employers.ts†L260-L275】

### Partially Implemented
- No ability for employers to place a job on hold or delete a job
- No candidate search or matching features for employers

### Not Implemented
- Shortlisting candidates directly from the employer portal
- Employer initiated analytics or reports

## Admin

### Implemented
- Search across candidates, employers and job posts【F:server/routes/admin.ts†L29-L51】
- Retrieve high level platform statistics【F:server/routes/admin.ts†L53-L70】
- Full CRUD on job posts including approve, reject, clone and fulfill actions【F:server/routes/admin.ts†L72-L470】
- Manage employer and candidate verification states and deletion【F:server/routes/admin.ts†L315-L413】
- View unverified profiles and generic verification endpoints【F:server/routes/admin.ts†L231-L314】
- Retrieve match recommendations for jobs or candidates and create shortlists【F:server/routes/admin.ts†L523-L577】
- Export platform data to Excel or PDF reports【F:server/routes/admin.ts†L579-L600】
- Admin login via Firebase token【F:server/routes/admin.ts†L603-L614】

### Partially Implemented
- Search analytics and caching utilities exist but are not wired into routes【F:server/utils/analytics.ts†L1-L34】【F:server/utils/cache.ts†L1-L74】
- Invite code schema is present but unused in routes

### Not Implemented
- Real‑time administration features or audit logging
- Fine grained role management beyond the single admin role

