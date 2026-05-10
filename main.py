from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse
import uvicorn
import os
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

app = FastAPI()

# Directory for outputs
os.makedirs("outputs", exist_ok=True)
os.makedirs("resumes", exist_ok=True)

class ResumeScreener:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english')

    def extract_experience(self, text):
        # Basic regex to find years of experience
        years = re.findall(r'(\d+)\s*(?:years?|yrs?)', text, re.IGNORECASE)
        return max([int(y) for y in years]) if years else 0

    def calculate_score(self, resume_text, jd_text, required_skills, min_exp):
        # 1. TF-IDF Similarity (50%)
        tfidf_matrix = self.vectorizer.fit_transform([jd_text, resume_text])
        cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        tfidf_score = cosine_sim * 100

        # 2. Skill Match (30%)
        resume_text_lower = resume_text.toLowerCase()
        skills_matched = [skill for skill in required_skills if skill.lower() in resume_text_lower]
        skill_score = (len(skills_matched) / len(required_skills)) * 100 if required_skills else 100

        # 3. Experience Match (20%)
        exp_found = self.extract_experience(resume_text)
        exp_score = min((exp_found / min_exp) * 100, 100) if min_exp > 0 else 100

        final_score = (tfidf_score * 0.5) + (skill_score * 0.3) + (exp_score * 0.2)
        
        status = "Shortlisted" if final_score >= 75 else "Review" if final_score >= 50 else "Rejected"
        
        return {
            "score": round(final_score),
            "status": status,
            "skills_matched": skills_matched,
            "experience_found": exp_found
        }

screener = ResumeScreener()
scan_history = []

@app.post("/upload-resume")
async def upload_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    required_skills: str = Form(...),
    min_experience: int = Form(...)
):
    content = await resume.read()
    # In a real app, use a lib like pdfminer or docx2txt here
    text = content.decode("utf-8", errors="ignore") 
    
    skills_list = [s.strip() for s in required_skills.split(",")]
    analysis = screener.calculate_score(text, job_description, skills_list, min_experience)
    
    result = {
        "filename": resume.filename,
        "analysis": analysis
    }
    scan_history.append(result)
    return result

@app.get("/rank-candidates")
async def rank_candidates():
    sorted_history = sorted(scan_history, key=lambda x: x["analysis"]["score"], reverse=True)
    return sorted_history

@app.get("/download-report")
async def download_report():
    df = pd.DataFrame([
        {
            "Candidate": h["filename"],
            "Score": h["analysis"]["score"],
            "Status": h["analysis"]["status"],
            "Skills": ", ".join(h["analysis"]["skills_matched"])
        } for h in scanHistory
    ])
    report_path = "outputs/ranking_report.csv"
    df.to_csv(report_path, index=False)
    return FileResponse(report_path, filename="ranking_report.csv")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000)
