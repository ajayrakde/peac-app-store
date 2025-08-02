import type { JobPost, Candidate } from "@shared/types";

interface MatchFactors {
  skillsScore: number;
  experienceScore: number;
  salaryScore: number;
  locationScore: number;
  qualificationScore: number;
}

export function calculateMatchScore(job: JobPost, candidate: Candidate): number {
  const factors = calculateMatchFactors(job, candidate);
  
  // Weighted scoring
  const weights = {
    skills: 0.4,
    experience: 0.2,
    salary: 0.2,
    location: 0.1,
    qualification: 0.1,
  };

  const totalScore = 
    factors.skillsScore * weights.skills +
    factors.experienceScore * weights.experience +
    factors.salaryScore * weights.salary +
    factors.locationScore * weights.location +
    factors.qualificationScore * weights.qualification;

  return Math.round(totalScore);
}

function calculateMatchFactors(job: JobPost, candidate: Candidate): MatchFactors {
  return {
    skillsScore: calculateSkillsMatch(job.skills as string[] || [], candidate.skills as string[] || []),
    experienceScore: calculateExperienceMatch(job.experienceRequired || "", candidate.experience as any[] || []),
    salaryScore: calculateSalaryMatch(job.salaryRange || "", candidate.expectedSalary || 0),
    locationScore: calculateLocationMatch(job.location || "", candidate.address || ""),
    qualificationScore: calculateQualificationMatch(job.minQualification || "", candidate.qualifications as any[] || []),
  };
}

function calculateSkillsMatch(jobSkills: string[], candidateSkills: string[]): number {
  if (jobSkills.length === 0) return 100;
  
  const matchedSkills = jobSkills.filter(skill => 
    candidateSkills.some(candidateSkill => 
      candidateSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(candidateSkill.toLowerCase())
    )
  );
  
  return Math.round((matchedSkills.length / jobSkills.length) * 100);
}

function calculateExperienceMatch(jobExperience: string, candidateExperience: any[]): number {
  // Extract years from job experience requirement
  const jobYearsMatch = jobExperience.match(/(\d+)/);
  const jobYears = jobYearsMatch ? parseInt(jobYearsMatch[1]) : 0;
  
  // Calculate total candidate experience
  const totalExperience = candidateExperience.reduce((total, exp) => {
    const durationMatch = exp.duration?.match(/(\d+)/);
    return total + (durationMatch ? parseInt(durationMatch[1]) : 0);
  }, 0);
  
  if (jobYears === 0) return 100;
  if (totalExperience >= jobYears) return 100;
  if (totalExperience === 0) return 0;
  
  return Math.round((totalExperience / jobYears) * 100);
}

function calculateSalaryMatch(jobSalaryRange: string, candidateExpectedSalary: number): number {
  // Extract salary range from job (e.g., "₹12-18 LPA")
  const salaryMatch = jobSalaryRange.match(/₹?(\d+)-?(\d+)?/);
  if (!salaryMatch) return 100;
  
  const minSalary = parseInt(salaryMatch[1]) * 100000; // Convert LPA to annual
  const maxSalary = salaryMatch[2] ? parseInt(salaryMatch[2]) * 100000 : minSalary;
  
  if (candidateExpectedSalary === 0) return 100;
  
  // Perfect match if within range
  if (candidateExpectedSalary >= minSalary && candidateExpectedSalary <= maxSalary) {
    return 100;
  }
  
  // Partial match based on proximity
  const midPoint = (minSalary + maxSalary) / 2;
  const difference = Math.abs(candidateExpectedSalary - midPoint);
  const maxDifference = Math.max(candidateExpectedSalary, midPoint);
  
  return Math.max(0, Math.round(100 - (difference / maxDifference) * 100));
}

function calculateLocationMatch(jobLocation: string, candidateAddress: string): number {
  if (!jobLocation || !candidateAddress) return 100;
  
  // Simple string matching for city/state
  const jobLocationLower = jobLocation.toLowerCase();
  const candidateAddressLower = candidateAddress.toLowerCase();
  
  // Check for exact city match
  if (candidateAddressLower.includes(jobLocationLower) || 
      jobLocationLower.includes(candidateAddressLower)) {
    return 100;
  }
  
  // Check for state match
  const states = ['bangalore', 'mumbai', 'delhi', 'chennai', 'hyderabad', 'pune', 'kolkata'];
  const jobState = states.find(state => jobLocationLower.includes(state));
  const candidateState = states.find(state => candidateAddressLower.includes(state));
  
  if (jobState && candidateState && jobState === candidateState) {
    return 80;
  }
  
  return 50; // Default for different locations
}

function calculateQualificationMatch(jobMinQualification: string, candidateQualifications: any[]): number {
  if (!jobMinQualification || candidateQualifications.length === 0) return 100;
  
  const jobQualLower = jobMinQualification.toLowerCase();
  
  // Qualification hierarchy
  const qualificationHierarchy = [
    'phd', 'doctorate',
    'masters', 'mba', 'mtech', 'm.tech', 'me',
    'bachelors', 'btech', 'b.tech', 'be', 'bsc', 'b.sc', 'bcom', 'b.com', 'ba',
    'diploma', 'associate'
  ];
  
  const getQualificationLevel = (qual: string) => {
    const qualLower = qual.toLowerCase();
    for (let i = 0; i < qualificationHierarchy.length; i++) {
      if (qualLower.includes(qualificationHierarchy[i])) {
        return qualificationHierarchy.length - i;
      }
    }
    return 0;
  };
  
  const jobQualLevel = getQualificationLevel(jobMinQualification);
  const candidateMaxQualLevel = Math.max(
    ...candidateQualifications.map(qual => getQualificationLevel(qual.degree || ''))
  );
  
  if (candidateMaxQualLevel >= jobQualLevel) return 100;
  if (candidateMaxQualLevel === 0) return 0;
  
  return Math.round((candidateMaxQualLevel / jobQualLevel) * 100);
}

export function rankCandidates(job: JobPost, candidates: Candidate[]): Array<{candidate: Candidate, score: number, factors: MatchFactors}> {
  return candidates
    .map(candidate => ({
      candidate,
      score: calculateMatchScore(job, candidate),
      factors: calculateMatchFactors(job, candidate)
    }))
    .sort((a, b) => b.score - a.score);
}

export function rankJobs(candidate: Candidate, jobs: JobPost[]): Array<{job: JobPost, score: number, factors: MatchFactors}> {
  return jobs
    .map(job => ({
      job,
      score: calculateMatchScore(job, candidate),
      factors: calculateMatchFactors(job, candidate)
    }))
    .sort((a, b) => b.score - a.score);
}
