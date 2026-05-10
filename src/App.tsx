/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Users, 
  FileText, 
  Briefcase, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  BrainCircuit,
  ArrowRight,
  ChevronRight,
  BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResumeUploader } from "./components/ResumeUploader";
import { Analysis, Candidate, Job } from "./types";

export default function App() {
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [minExp, setMinExp] = useState(0);
  const [eduPref, setEduPref] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activeTab, setActiveTab] = useState<"job" | "rankings">("job");

  const handleUpload = async (file: File) => {
    if (!jobDescription) {
      alert("Please enter a job description first.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription);
    formData.append("requiredSkills", JSON.stringify(requiredSkills.split(",").map(s => s.trim()).filter(Boolean)));
    formData.append("minExperience", minExp.toString());
    formData.append("educationPreference", eduPref);

    try {
      const response = await fetch("/api/screen", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      
      const newCandidate: Candidate = {
        id: data.id || Math.random().toString(36).substring(7),
        fileName: data.fileName,
        analysis: data.analysis
      };

      setCandidates(prev => [newCandidate, ...prev]);
      setActiveTab("rankings");
    } catch (error) {
      console.error(error);
      alert("Error analyzing resume. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const sortedCandidates = [...candidates].sort((a, b) => b.analysis.score - a.analysis.score);

  return (
    <div className="min-h-screen border-t-4 border-brand-secondary">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-brand-secondary p-1.5 rounded-lg shadow-sm">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900" id="app-title">
              ScreenAI <span className="text-neutral-400 font-normal">ATS</span>
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-1 font-medium text-sm text-neutral-600">
              <button 
                onClick={() => setActiveTab("job")}
                className={`px-3 py-2 rounded-md transition-colors ${activeTab === "job" ? "text-brand-secondary bg-indigo-50" : "hover:text-neutral-900"}`}
              >
                Configuration
              </button>
              <button 
                onClick={() => setActiveTab("rankings")}
                className={`px-3 py-2 rounded-md transition-colors ${activeTab === "rankings" ? "text-brand-secondary bg-indigo-50" : "hover:text-neutral-900"}`}
              >
                Rankings
              </button>
            </nav>
            <div className="w-8 h-8 rounded-full bg-neutral-200 border border-white shadow-sm flex items-center justify-center">
              <Users className="w-4 h-4 text-neutral-500" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {activeTab === "job" ? (
            <motion.div
              key="job-config"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-12"
            >
              <div className="lg:col-span-3 space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-neutral-900 mb-2">Job Configuration</h2>
                  <p className="text-neutral-500">Define your ideal candidate requirements for AI matching.</p>
                </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">Position Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Senior Frontend Engineer"
                        className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-brand-secondary/20 focus:border-brand-secondary outline-none transition-all"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">Required Skills (Comma Separated)</label>
                        <input 
                          type="text" 
                          placeholder="Python, SQL, React, AWS..."
                          className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-brand-secondary/20 focus:border-brand-secondary outline-none transition-all"
                          value={requiredSkills}
                          onChange={(e) => setRequiredSkills(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">Min Experience (Years)</label>
                        <input 
                          type="number" 
                          className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-brand-secondary/20 focus:border-brand-secondary outline-none transition-all"
                          value={minExp}
                          onChange={(e) => setMinExp(parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">Education Preference</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Bachelor's in CS, Master's in Data Science"
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-brand-secondary/20 focus:border-brand-secondary outline-none transition-all"
                        value={eduPref}
                        onChange={(e) => setEduPref(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">Job Description</label>
                      <textarea 
                        rows={8}
                      placeholder="Paste the full job description here... include technical stack, years of experience, and key responsibilities."
                      className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-brand-secondary/20 focus:border-brand-secondary outline-none transition-all resize-none font-sans leading-relaxed"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      id="jd-input"
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-8">
                <div className="p-6 bg-white border border-neutral-100 rounded-2xl shadow-sm">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-brand-secondary" />
                    Upload Candidates
                  </h3>
                  {!jobDescription && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-lg flex gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-700 leading-tight">
                        Please provide a **Job Description** first so the AI knows what skills to look for.
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-neutral-500 mb-6 font-sans">
                    Once the JD is set, drop resumes here to begin semantic ranking.
                  </p>
                  <div className={!jobDescription ? "opacity-50 pointer-events-none" : ""}>
                    <ResumeUploader onUpload={handleUpload} isUploading={isUploading} />
                  </div>
                  
                  {candidates.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-neutral-50">
                      <button 
                        onClick={() => setActiveTab("rankings")}
                        className="w-full flex items-center justify-between p-4 bg-neutral-900 text-white rounded-xl font-bold group transition-all hover:bg-neutral-800"
                        id="view-rankings-cta"
                      >
                        View {candidates.length} Rankings
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <div className="flex gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900 mb-1">Scoring Methodology</h4>
                      <p className="text-xs text-blue-800/80 leading-relaxed">
                      Scoring breakdown: **50% TF-IDF** Similarity, **30% Skill Match**, and **20% Experience Match**. Candidates sorted by total score.
                    </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="rankings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold uppercase tracking-wider text-brand-secondary">Rankings</span>
                    <ChevronRight className="w-4 h-4 text-neutral-300" />
                    <span className="text-sm text-neutral-500 font-medium">{jobTitle || "Untitled Role"}</span>
                  </div>
                  <h2 className="text-3xl font-bold text-neutral-900">Applicant Pool</h2>
                </div>
                <div className="flex gap-2">
                  {candidates.length > 0 && (
                    <a 
                      href="/api/download-report"
                      download
                      className="px-4 py-2 text-sm font-bold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-2"
                    >
                      Export CSV
                    </a>
                  )}
                  <button 
                    onClick={() => setActiveTab("job")}
                    className="px-4 py-2 text-sm font-bold text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Edit Job Info
                  </button>
                </div>
              </div>

              {candidates.length === 0 ? (
                <div className="py-24 text-center bg-white rounded-3xl border border-neutral-100 border-dashed">
                  <div className="p-4 bg-neutral-50 rounded-full w-16 h-16 inline-flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-neutral-300" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900">No applicants yet</h3>
                  <p className="text-neutral-500 mt-1 max-w-sm mx-auto font-sans">
                    Head back to the configuration page to upload your first set of resumes.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {sortedCandidates.map((candidate, index) => (
                    <motion.div
                      key={candidate.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-white rounded-2xl border border-neutral-100 p-6 hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
                      id={`candidate-${candidate.id}`}
                    >
                      <div className="flex flex-col lg:flex-row gap-8">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                                  candidate.analysis.status === "Shortlisted" ? "bg-emerald-100 text-emerald-700" : 
                                  candidate.analysis.status === "Review" ? "bg-amber-100 text-amber-700" :
                                  "bg-rose-100 text-rose-700"
                                }`}>
                                  {candidate.analysis.status}
                                </span>
                                <span className="text-neutral-300 text-[10px]">#00{candidates.length - index}</span>
                              </div>
                              <h3 className="text-xl font-bold text-neutral-900 group-hover:text-brand-secondary transition-colors" id={`name-${candidate.id}`}>
                                {candidate.fileName}
                              </h3>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-black text-neutral-900 tabular-nums">
                                {candidate.analysis.score}<span className="text-neutral-300 text-lg">/100</span>
                              </div>
                              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">Match Affinity</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-neutral-50 rounded-xl">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="p-1 bg-emerald-100 rounded text-emerald-600">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wide text-neutral-500">Matched Skills</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {candidate.analysis.matchedSkills.map(skill => (
                                  <span key={skill} className="px-2 py-0.5 bg-white border border-neutral-200 rounded-md text-[11px] font-medium text-neutral-700">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="p-4 bg-neutral-50 rounded-xl">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="p-1 bg-amber-100 rounded text-amber-600">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wide text-neutral-500">Missing Skills</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {candidate.analysis.missingSkills.length > 0 ? (
                                  candidate.analysis.missingSkills.map(gap => (
                                    <span key={gap} className="px-2 py-0.5 bg-white border border-rose-100 text-rose-600 rounded-md text-[11px] font-medium">
                                      {gap}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-neutral-400 font-medium">Fully Matched</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                             <div className="p-2 bg-neutral-50 rounded-lg text-center">
                               <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-tighter">TF-IDF Similarity</div>
                               <div className="text-xs font-bold text-neutral-800">{candidate.analysis.tfidfScore}%</div>
                             </div>
                             <div className="p-2 bg-neutral-50 rounded-lg text-center">
                               <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-tighter">Skill Match</div>
                               <div className="text-xs font-bold text-neutral-800">{candidate.analysis.skillScore}%</div>
                             </div>
                             <div className="p-2 bg-neutral-50 rounded-lg text-center">
                               <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-tighter">Experience Fit</div>
                               <div className="text-xs font-bold text-neutral-800">{candidate.analysis.expScore}%</div>
                             </div>
                          </div>

                          <div className="pt-2">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold uppercase tracking-wide text-neutral-500">Performance Report</span>
                            </div>
                            <p className="text-sm text-neutral-600 leading-relaxed font-sans" id={`reasoning-${candidate.id}`}>
                              {candidate.analysis.reason}
                            </p>
                          </div>
                        </div>
                        
                        <div className="lg:w-64 shrink-0 flex flex-col gap-4">
                          <div className="p-4 border border-neutral-100 rounded-xl bg-neutral-50 flex flex-col justify-between h-full">
                            <div>
                              <div className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-4">Summary</div>
                              <div className="space-y-4">
                                <div>
                                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-tighter mb-1">Found Experience</div>
                                  <div className="text-sm font-bold text-neutral-900">{candidate.analysis.experienceFound} Years</div>
                                </div>
                              </div>
                            </div>
                            <div className="pt-4 mt-4 border-t border-neutral-200 space-y-2">
                              <button className="w-full py-2 bg-neutral-900 text-white text-xs font-bold rounded-lg hover:gradient-primary transition-all">
                                View Profile
                              </button>
                              <button className="w-full py-2 bg-white border border-neutral-200 text-xs font-bold rounded-lg hover:bg-neutral-50 transition-all text-neutral-700">
                                Download CV
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
