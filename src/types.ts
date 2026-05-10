/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Analysis {
  score: number;
  tfidfScore: number;
  skillScore: number;
  expScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceFound: number;
  status: "Shortlisted" | "Review" | "Rejected";
  reason: string;
}

export interface Candidate {
  id: string;
  fileName: string;
  analysis: Analysis;
}

export interface Job {
  id: string;
  title: string;
  description: string;
}
