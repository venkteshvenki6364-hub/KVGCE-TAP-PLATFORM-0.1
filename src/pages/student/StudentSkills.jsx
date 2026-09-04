import { useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import "./StudentSkills.css";

const SEMESTER_PERFORMANCE_DATA = [
  { semester: "1st Semester", totalMarks: 1000, obtainedMarks: 780, percentage: "78.00%", sgpa: "7.80", cgpa: "7.80" },
  { semester: "2nd Semester", totalMarks: 1000, obtainedMarks: 820, percentage: "82.00%", sgpa: "8.20", cgpa: "8.00" },
  { semester: "3rd Semester", totalMarks: 1000, obtainedMarks: 850, percentage: "85.00%", sgpa: "8.50", cgpa: "8.17" },
  { semester: "4th Semester", totalMarks: 1000, obtainedMarks: 800, percentage: "80.00%", sgpa: "8.00", cgpa: "8.20" },
  { semester: "5th Semester", totalMarks: 1000, obtainedMarks: 830, percentage: "83.00%", sgpa: "8.30", cgpa: "8.22" },
  { semester: "6th Semester", totalMarks: 1000, obtainedMarks: 860, percentage: "86.00%", sgpa: "8.60", cgpa: "8.37" },
  { semester: "7th Semester", totalMarks: 1000, obtainedMarks: 820, percentage: "82.00%", sgpa: "8.20", cgpa: "8.36" },
  { semester: "8th Semester", totalMarks: 1000, obtainedMarks: 808, percentage: "80.80%", sgpa: "8.08", cgpa: "8.21" },
];

function StudentSkills() {
  const [activePdf, setActivePdf] = useState(null);

  const handleViewPdf = (title) => {
    setActivePdf(title);
  };

  return (
    <DashboardLayout title="Academics">
      <div className="academics-page-container">
        {/* HEADER TITLE & SUBTITLE */}
        <div className="academics-page-header">
          <h2 className="academics-heading">Academics</h2>
          <p className="academics-subheading">View your academic details and performance</p>
        </div>

        {/* TOP SUMMARY CARDS (3 CARDS) */}
        <div className="academic-cards-grid">
          {/* CARD 1: SSLC (10th) */}
          <div className="academic-summary-card card-sslc">
            <div className="card-top-title-row text-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <h3>SSLC (10th)</h3>
            </div>

            <div className="card-info-rows">
              <div className="info-row">
                <span className="info-label">School Name</span>
                <span className="info-value font-semibold">St. Joseph's High School</span>
              </div>
              <div className="info-row">
                <span className="info-label">Year of Passing</span>
                <span className="info-value">2018</span>
              </div>
              <div className="info-row">
                <span className="info-label">Total Marks</span>
                <span className="info-value">625 / 625</span>
              </div>
              <div className="info-row">
                <span className="info-label">Percentage</span>
                <span className="info-value text-green font-bold">100.00%</span>
              </div>
              <div className="info-row pdf-row">
                <span className="info-label">Certificate (PDF)</span>
                <button
                  className="view-pdf-btn"
                  onClick={() => handleViewPdf("SSLC (10th) Certificate")}
                >
                  <span>View PDF</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* CARD 2: PUC (12th) */}
          <div className="academic-summary-card card-puc">
            <div className="card-top-title-row text-green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                <path d="M9 22v-4h6v4" />
                <line x1="8" y1="6" x2="8" y2="6" />
                <line x1="16" y1="6" x2="16" y2="6" />
              </svg>
              <h3>PUC (12th)</h3>
            </div>

            <div className="card-info-rows">
              <div className="info-row">
                <span className="info-label">College Name</span>
                <span className="info-value font-semibold">Govt. PU College</span>
              </div>
              <div className="info-row">
                <span className="info-label">Year of Passing</span>
                <span className="info-value">2020</span>
              </div>
              <div className="info-row">
                <span className="info-label">Total Marks</span>
                <span className="info-value">600 / 600</span>
              </div>
              <div className="info-row">
                <span className="info-label">Percentage</span>
                <span className="info-value text-green font-bold">100.00%</span>
              </div>
              <div className="info-row pdf-row">
                <span className="info-label">Certificate (PDF)</span>
                <button
                  className="view-pdf-btn"
                  onClick={() => handleViewPdf("PUC (12th) Certificate")}
                >
                  <span>View PDF</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* CARD 3: B.E (CSE) – Semester Performance */}
          <div className="academic-summary-card card-be">
            <div className="card-top-title-row text-purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
              <h3>B.E (CSE) – Semester Performance</h3>
            </div>

            {/* TOP 2 STAT BOXES */}
            <div className="be-stat-boxes-grid">
              <div className="be-stat-box">
                <span className="be-stat-lbl">CGPA (Till Now)</span>
                <span className="be-stat-val text-blue font-bold">8.21</span>
              </div>
              <div className="be-stat-box">
                <span className="be-stat-lbl">Total Credits Earned</span>
                <span className="be-stat-val text-green font-bold">160</span>
              </div>
            </div>

            {/* BOTTOM SUMMARY STATS */}
            <div className="be-summary-row">
              <div className="be-sum-item">
                <span className="be-sum-lbl">Total Marks</span>
                <span className="be-sum-val">8000</span>
              </div>
              <div className="be-sum-item">
                <span className="be-sum-lbl">Obtained Marks</span>
                <span className="be-sum-val">6568</span>
              </div>
              <div className="be-sum-item">
                <span className="be-sum-lbl">Overall Percentage</span>
                <span className="be-sum-val text-blue font-bold">82.10%</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM TABLE: SEMESTER WISE PERFORMANCE */}
        <div className="semester-performance-card">
          <h3 className="section-title">Semester Wise Performance</h3>

          <div className="table-responsive-wrapper">
            <table className="semester-table">
              <thead>
                <tr>
                  <th>Semester</th>
                  <th>Total Marks</th>
                  <th>Obtained Marks</th>
                  <th>Percentage</th>
                  <th>SGPA</th>
                  <th>CGPA</th>
                  <th>Marksheet (PDF)</th>
                </tr>
              </thead>
              <tbody>
                {SEMESTER_PERFORMANCE_DATA.map((row, index) => (
                  <tr key={index}>
                    <td className="font-semibold text-slate-800">{row.semester}</td>
                    <td>{row.totalMarks}</td>
                    <td>{row.obtainedMarks}</td>
                    <td className="text-green font-semibold">{row.percentage}</td>
                    <td className="font-semibold">{row.sgpa}</td>
                    <td className="font-semibold">{row.cgpa}</td>
                    <td>
                      <button
                        className="view-pdf-btn"
                        onClick={() => handleViewPdf(`${row.semester} Marksheet`)}
                      >
                        <span>View PDF</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PDF MODAL PREVIEW */}
        {activePdf && (
          <div className="pdf-modal-backdrop" onClick={() => setActivePdf(null)}>
            <div className="pdf-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="pdf-modal-header">
                <h3>{activePdf}</h3>
                <button className="close-modal-btn" onClick={() => setActivePdf(null)}>
                  &times;
                </button>
              </div>
              <div className="pdf-modal-body">
                <div className="pdf-dummy-preview">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <h4>{activePdf} Document</h4>
                  <p>Official verified academic document for KVGCE-TAP Platform.</p>
                  <button className="download-pdf-btn" onClick={() => alert("Downloading PDF document...")}>
                    Download Verified PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default StudentSkills;
