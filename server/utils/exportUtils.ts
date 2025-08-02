import ExcelJS from "exceljs";
import { getJobStatus } from "@shared/utils/jobStatus";

export async function exportToExcel(data: any): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  
  // Candidates sheet
  const candidatesSheet = workbook.addWorksheet('Candidates');
  candidatesSheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Expected Salary', key: 'expectedSalary', width: 15 },
    { header: 'Skills', key: 'skills', width: 40 },
    { header: 'Experience', key: 'experience', width: 30 },
    { header: 'Location', key: 'location', width: 20 },
    { header: 'Profile Status', key: 'profileStatus', width: 15 },
    { header: 'Created At', key: 'createdAt', width: 20 },
  ];

  data.candidates.forEach((candidate: any) => {
    candidatesSheet.addRow({
      id: candidate.id,
      name: `Candidate ${candidate.id}`,
      email: `candidate${candidate.id}@example.com`,
      phone: `+91 98765${candidate.id.toString().padStart(5, '0')}`,
      expectedSalary: candidate.expectedSalary || 'Not specified',
      skills: Array.isArray(candidate.skills) ? candidate.skills.join(', ') : 'Not specified',
      experience: Array.isArray(candidate.experience) ? 
        candidate.experience.map((exp: any) => `${exp.company} - ${exp.position}`).join('; ') : 
        'Not specified',
      location: candidate.address || 'Not specified',
      profileStatus: candidate.profileStatus,
      createdAt: candidate.createdAt?.toISOString() || 'Unknown',
    });
  });

  // Employers sheet
  const employersSheet = workbook.addWorksheet('Employers');
  employersSheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Organization Name', key: 'organizationName', width: 30 },
    { header: 'Registration Number', key: 'registrationNumber', width: 20 },
    { header: 'Industry', key: 'businessType', width: 20 },
    { header: 'Contact Email', key: 'contactEmail', width: 30 },
    { header: 'Contact Phone', key: 'contactPhone', width: 15 },
    { header: 'Address', key: 'address', width: 40 },
    { header: 'Profile Status', key: 'profileStatus', width: 15 },
    { header: 'Created At', key: 'createdAt', width: 20 },
  ];

  data.employers.forEach((employer: any) => {
    employersSheet.addRow({
      id: employer.id,
      organizationName: employer.organizationName || 'Not specified',
      registrationNumber: employer.registrationNumber || 'Not specified',
      businessType: employer.businessType || 'Not specified',
      contactEmail: employer.contactEmail || 'Not specified',
      contactPhone: employer.contactPhone || 'Not specified',
      address: employer.address || 'Not specified',
      profileStatus: employer.profileStatus,
      createdAt: employer.createdAt?.toISOString() || 'Unknown',
    });
  });

  // Job Posts sheet
  const jobsSheet = workbook.addWorksheet('Job Posts');
  jobsSheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Job Code', key: 'jobCode', width: 15 },
    { header: 'Title', key: 'title', width: 30 },
    { header: 'Employer ID', key: 'employerId', width: 12 },
    { header: 'Min Qualification', key: 'minQualification', width: 20 },
    { header: 'Experience Required', key: 'experienceRequired', width: 20 },
    { header: 'Skills', key: 'skills', width: 40 },
    { header: 'Salary Range', key: 'salaryRange', width: 15 },
    { header: 'Location', key: 'location', width: 20 },
    { header: 'Applications Count', key: 'applicationsCount', width: 18 },
    { header: 'Status', key: 'status', width: 10 },
    { header: 'Created At', key: 'createdAt', width: 20 },
  ];

  data.jobPosts.forEach((job: any) => {
    jobsSheet.addRow({
      id: job.id,
      jobCode: job.jobCode || 'Not specified',
      title: job.title || 'Not specified',
      employerId: job.employerId,
      minQualification: job.minQualification || 'Not specified',
      experienceRequired: job.experienceRequired || 'Not specified',
      skills: Array.isArray(job.skills) ? job.skills.join(', ') : 'Not specified',
      salaryRange: job.salaryRange || 'Not specified',
      location: job.location || 'Not specified',
      applicationsCount: job.applicationsCount || 0,
      status: getJobStatus(job),
      createdAt: job.createdAt?.toISOString() || 'Unknown',
    });
  });

  // Applications sheet
  const applicationsSheet = workbook.addWorksheet('Applications');
  applicationsSheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Candidate ID', key: 'candidateId', width: 12 },
    { header: 'Job Post ID', key: 'jobPostId', width: 12 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Applied At', key: 'appliedAt', width: 20 },
    { header: 'Updated At', key: 'updatedAt', width: 20 },
  ];

  data.applications.forEach((application: any) => {
    applicationsSheet.addRow({
      id: application.id,
      candidateId: application.candidateId,
      jobPostId: application.jobPostId,
      status: application.status || 'applied',
      appliedAt: application.appliedAt?.toISOString() || 'Unknown',
      updatedAt: application.updatedAt?.toISOString() || 'Unknown',
    });
  });

  // Style headers
  [candidatesSheet, employersSheet, jobsSheet, applicationsSheet].forEach(sheet => {
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  });

  return await workbook.xlsx.writeBuffer() as Buffer;
}

export async function exportToPDF(data: any): Promise<Buffer> {
  // For PDF generation, we'll create a simple text-based report
  // In a real application, you'd use a library like PDFKit or jsPDF
  
  const reportContent = `
LokalTalent Platform Report
Generated on: ${new Date().toISOString()}

SUMMARY STATISTICS
==================
Total Candidates: ${data.candidates.length}
Total Employers: ${data.employers.length}
Total Job Posts: ${data.jobPosts.length}
Total Applications: ${data.applications.length}
Total Shortlists: ${data.shortlists.length}

CANDIDATES
==========
${data.candidates.map((candidate: any, index: number) => `
${index + 1}. Candidate ID: ${candidate.id}
   Expected Salary: ${candidate.expectedSalary || 'Not specified'}
   Skills: ${Array.isArray(candidate.skills) ? candidate.skills.join(', ') : 'Not specified'}
   Profile Status: ${candidate.profileStatus}
   Created: ${candidate.createdAt?.toISOString() || 'Unknown'}
`).join('')}

EMPLOYERS
=========
${data.employers.map((employer: any, index: number) => `
${index + 1}. ${employer.organizationName || 'Unknown Organization'}
   Registration: ${employer.registrationNumber || 'Not specified'}
   Industry: ${employer.businessType || 'Not specified'}
   Profile Status: ${employer.profileStatus}
   Created: ${employer.createdAt?.toISOString() || 'Unknown'}
`).join('')}

JOB POSTS
=========
${data.jobPosts.map((job: any, index: number) => `
${index + 1}. ${job.title || 'Unknown Title'} (${job.jobCode || 'No Code'})
   Employer ID: ${job.employerId}
   Qualification: ${job.minQualification || 'Not specified'}
   Experience: ${job.experienceRequired || 'Not specified'}
   Salary: ${job.salaryRange || 'Not specified'}
   Location: ${job.location || 'Not specified'}
   Applications: ${job.applicationsCount || 0}
   Status: ${getJobStatus(job)}
   Created: ${job.createdAt?.toISOString() || 'Unknown'}
`).join('')}

APPLICATIONS
============
${data.applications.map((app: any, index: number) => `
${index + 1}. Application ID: ${app.id}
   Candidate ID: ${app.candidateId}
   Job Post ID: ${app.jobPostId}
   Status: ${app.status || 'applied'}
   Applied: ${app.appliedAt?.toISOString() || 'Unknown'}
`).join('')}

End of Report
`;

  // Convert text to PDF buffer (simplified)
  // In a real application, use a proper PDF library
  return Buffer.from(reportContent, 'utf-8');
}
