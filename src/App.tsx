import React, { useState, useEffect, useRef } from 'react';

// --- ICONS (Inline SVGs for portability) ---
const ClockIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CheckIcon = () => <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const XIcon = () => <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const PlayIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;
const PauseIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const UploadIcon = () => <svg className="w-10 h-10 mb-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>;
const SpinnerIcon = () => <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

// --- TYPES & INTERFACES ---
type QuestionType = 'multiple_choice' | 'fill_blank' | 'true_false_ng';

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  answer: string;
  explanation?: string;
}

interface Part {
  id: string;
  title: string;
  content?: string; 
  audioUrl?: string; 
  transcript?: string;
  questions: Question[];
}

interface Section {
  title: string;
  timeLimit: number; 
  parts: Part[];
}

interface TestData {
  id: string;
  title: string;
  sections: {
    reading: Section;
    listening: Section;
    writing: Section;
  };
}

interface Submission {
  id: string;
  studentName: string;
  date: string;
  scores: { listening: number, reading: number, writingMock: number, overall: string };
  writingAnswers: { task1: string, task2: string };
}

// --- MOCK DATA ---
const defaultTestData: TestData = {
  id: "test-001",
  title: "IELTS Placement Test",
  sections: {
    listening: {
      title: "Listening Test", timeLimit: 1800,
      parts: [
        {
          id: "L1", title: "Part 1: Hotel Booking", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          questions: [
            { id: "l_q1", type: "fill_blank", text: "Date of arrival: 15th of _______", answer: "May", explanation: "The guest clearly says '15th of May'." },
            { id: "l_q2", type: "multiple_choice", text: "What type of room does the guest want?", options: ["Single", "Double", "Suite"], answer: "Double" }
          ]
        }
      ]
    },
    reading: {
      title: "Reading Test", timeLimit: 3600,
      parts: [
        {
          id: "R1", title: "Passage 1: The History of Tea", content: "Tea is one of the most popular beverages in the world. It originated in China, where it was initially used for medicinal purposes...",
          questions: [
            { id: "r_q1", type: "true_false_ng", text: "Tea was originally used as a medicine in China.", options: ["True", "False", "Not Given"], answer: "True" },
            { id: "r_q2", type: "fill_blank", text: "Tea was brought to Europe in the 16th century by _______ merchants.", answer: "Dutch" }
          ]
        }
      ]
    },
    writing: {
      title: "Writing Test", timeLimit: 3600,
      parts: [
        { id: "W1", title: "Task 1", content: "The chart below shows the number of men and women in further education...", questions: [{ id: "w_q1", type: "fill_blank", text: "Write your answer here:", answer: "" }] },
        { id: "W2", title: "Task 2", content: "Some people think that all university students should study whatever they like...", questions: [{ id: "w_q2", type: "fill_blank", text: "Write your answer here:", answer: "" }] }
      ]
    }
  }
};

// --- UTILITIES ---
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const calculateBandScore = (rawScore: number, maxScore: number) => {
  if (maxScore === 0) return 0;
  const p = rawScore / maxScore;
  if (p >= 0.9) return 9.0;
  if (p >= 0.85) return 8.5;
  if (p >= 0.77) return 8.0;
  if (p >= 0.7) return 7.5;
  if (p >= 0.6) return 7.0;
  if (p >= 0.5) return 6.5;
  if (p >= 0.4) return 6.0;
  if (p >= 0.3) return 5.5;
  if (p >= 0.2) return 5.0;
  return 4.0; 
};

// Hàm đọc file ngoài
const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
  if (document.querySelector(`script[src="${src}"]`)) return resolve();
  const script = document.createElement('script');
  script.src = src;
  script.onload = () => resolve();
  script.onerror = reject;
  document.head.appendChild(script);
});

// Hàm gọi AI
const callGeminiForSection = async (documentText: string, sectionType: 'listening' | 'reading' | 'writing', retries = 5, delay = 1000): Promise<any> => {
  const apiKey = ""; // API Key từ môi trường (Nếu cần tự điền, bạn dán Key vào giữa cặp ngoặc kép này)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const prompt = `Bạn là chuyên gia IELTS. Trích xuất nội dung cho phần thi ${sectionType.toUpperCase()} thành định dạng JSON.
Mẫu yêu cầu:
{"title": "${sectionType} Test", "timeLimit": 3600, "parts": [{"id": "p1", "title": "Part 1", "content": "Nội dung...", "audioUrl": "", "questions": [{"id": "q1", "type": "multiple_choice | fill_blank | true_false_ng", "text": "Câu hỏi", "options": ["A", "B"], "answer": "Đáp án"}]}]}
Trả về CHỈ JSON hợp lệ, không có chữ thừa. Dữ liệu đầu vào:
${documentText.substring(0, 30000)}`;

  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }) });
    if (!res.ok) throw new Error("API lỗi"); 
    const data = await res.json();
    return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
  } catch (err) {
    if (retries > 0) { await new Promise(r => setTimeout(r, delay)); return callGeminiForSection(documentText, sectionType, retries - 1, delay * 2); }
    throw err;
  }
};

// --- UI COMPONENTS ---
const Timer = ({ timeLimit, onTimeUp }: { timeLimit: number, onTimeUp: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  useEffect(() => { setTimeLeft(timeLimit); }, [timeLimit]);
  useEffect(() => {
    if (timeLeft <= 0) { onTimeUp(); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, onTimeUp]);
  return <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-slate-700'}`}><ClockIcon /> {formatTime(timeLeft)}</div>;
};

const AudioPlayer = ({ url }: { url: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const togglePlay = () => { if (audioRef.current) { isPlaying ? audioRef.current.pause() : audioRef.current.play(); setIsPlaying(!isPlaying); } };
  return (
    <div className="bg-slate-100 p-4 rounded-xl flex items-center gap-4 mb-6 border border-slate-200">
      <button onClick={togglePlay} className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">{isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
      <div className="flex-1 bg-gray-300 h-2 rounded-full overflow-hidden"><div className="bg-blue-600 h-full" style={{ width: `${progress}%` }}></div></div>
      <audio ref={audioRef} src={url || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"} onTimeUpdate={() => setProgress((audioRef.current!.currentTime / audioRef.current!.duration) * 100)} onEnded={() => setIsPlaying(false)} />
    </div>
  );
};

const QuestionInput = ({ question, value, onChange, isReview, isCorrect }: any) => {
  const renderInput = () => {
    switch (question.type) {
      case 'multiple_choice':
      case 'true_false_ng':
        return <div className="flex flex-col gap-2 mt-2">{question.options?.map((opt: string) => <label key={opt} className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${value === opt ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} ${isReview && value === opt && !isCorrect ? 'border-red-500 bg-red-50' : ''} ${isReview && opt === question.answer ? 'border-green-500 bg-green-50' : ''}`}><input type="radio" name={question.id} value={opt} checked={value === opt} onChange={(e) => onChange(question.id, e.target.value)} disabled={isReview} className="w-4 h-4 text-blue-600" />{opt}</label>)}</div>;
      case 'fill_blank':
        if (question.id.startsWith('w_')) return <textarea className="mt-2 w-full h-64 p-4 border rounded-lg focus:ring-2" placeholder="Gõ bài viết..." value={value || ''} onChange={(e) => onChange(question.id, e.target.value)} disabled={isReview} />;
        return <input type="text" className={`mt-2 w-full p-2 border rounded-md focus:ring-2 ${isReview ? (isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : 'border-gray-300'}`} value={value || ''} onChange={(e) => onChange(question.id, e.target.value)} disabled={isReview} placeholder="Nhập đáp án..." />;
      default: return null;
    }
  };
  return (
    <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-100"><div className="flex gap-3">{!question.id.startsWith('w_') && <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full font-bold">{question.id.replace(/[^0-9]/g, '') || '?'}</span>}<div className="flex-1"><p className="font-medium text-lg">{question.text}</p>{renderInput()}{isReview && !question.id.startsWith('w_') && <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm"><div className="flex items-center gap-2">{isCorrect ? <CheckIcon /> : <XIcon />}<span className="font-bold">Đáp án đúng: {question.answer}</span></div></div>}</div></div></div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [appState, setAppState] = useState<'home' | 'test' | 'results' | 'admin'>('home');
  const [currentSection, setCurrentSection] = useState<'listening' | 'reading' | 'writing'>('listening');
  const [testData, setTestData] = useState<TestData>(defaultTestData);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [adminMode, setAdminMode] = useState<'ai' | 'json' | 'submissions'>('ai');
  const [adminJsonInput, setAdminJsonInput] = useState(JSON.stringify(defaultTestData, null, 2));
  const [processingSection, setProcessingSection] = useState<'listening' | 'reading' | 'writing' | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [studentName, setStudentName] = useState('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Chỉ lấy dữ liệu khi Component vừa mới Mount, tránh lỗi Render Loop trên Vercel
  useEffect(() => {
    try {
      const savedAns = localStorage.getItem('ielts_draft_answers');
      if (savedAns) setAnswers(JSON.parse(savedAns));
      const savedData = localStorage.getItem('ielts_test_data');
      if (savedData) {
          const parsedData = JSON.parse(savedData);
          setTestData(parsedData);
          setAdminJsonInput(JSON.stringify(parsedData, null, 2));
      }
    } catch (e) {
      console.error("Lỗi đọc Storage:", e);
    }
  }, []);

  const handleAnswerChange = (qId: string, value: string) => {
      const newAnswers = { ...answers, [qId]: value };
      setAnswers(newAnswers);
      // Lưu nhẹ vào Storage
      try { localStorage.setItem('ielts_draft_answers', JSON.stringify(newAnswers)); } catch(e){}
  };

  const submitTest = () => {
    let rCorrect = 0, rTotal = 0, lCorrect = 0, lTotal = 0;
    const evaluateObj = (section: Section, type: 'r' | 'l') => {
      section?.parts?.forEach(part => part.questions?.forEach(q => {
        if (type === 'r') rTotal++; else lTotal++;
        if ((answers[q.id] || '').trim().toLowerCase() === (q.answer || '').trim().toLowerCase() && q.answer !== '') {
          if (type === 'r') rCorrect++; else lCorrect++;
        }
      }));
    };
    evaluateObj(testData.sections.reading, 'r'); evaluateObj(testData.sections.listening, 'l');
    const rBand = calculateBandScore(rCorrect, rTotal); const lBand = calculateBandScore(lCorrect, lTotal);
    const w1Words = (answers['w_q1'] || '').trim().split(/\s+/).filter(w => w.length > 0).length;
    const w2Words = (answers['w_q2'] || '').trim().split(/\s+/).filter(w => w.length > 0).length;
    const wBand = (w1Words === 0 && w2Words === 0) ? 0 : (w1Words > 150 && w2Words > 250 ? 6.5 : 6.0);
    const overall = ((rBand + lBand + wBand) / 3).toFixed(1);

    const newSub: Submission = {
      id: Date.now().toString(), studentName: studentName || 'Học viên ẩn danh', date: new Date().toLocaleString('vi-VN'),
      scores: { listening: lBand, reading: rBand, writingMock: wBand, overall },
      writingAnswers: { task1: answers['w_q1'] || 'Không viết', task2: answers['w_q2'] || 'Không viết' }
    };

    try {
        const subs = JSON.parse(localStorage.getItem('ielts_submissions') || '[]');
        localStorage.setItem('ielts_submissions', JSON.stringify([newSub, ...subs]));
        localStorage.removeItem('ielts_draft_answers');
    } catch(e){}
    
    setShowSubmitModal(false); setAppState('results');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, section: 'listening' | 'reading' | 'writing') => {
    const file = e.target.files?.[0]; if (!file) return;
    setProcessingSection(section); setUploadStatus(`Đang đọc file ${file.name}...`);
    try {
      let text = await file.text();
      setUploadStatus(`AI đang phân tích phần ${section.toUpperCase()}...`);
      const generated = await callGeminiForSection(text, section);
      
      const newData = { ...testData };
      newData.sections[section] = generated;
      setTestData(newData);
      setAdminJsonInput(JSON.stringify(newData, null, 2));
      try { localStorage.setItem('ielts_test_data', JSON.stringify(newData)); } catch(e){}
      alert(`Nạp thành công ${section}!`);
    } catch (err: any) { alert("Lỗi: " + err.message); } 
    finally { setProcessingSection(null); setUploadStatus(''); e.target.value = ''; }
  };

  const renderHome = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><div className="max-w-2xl w-full bg-white p-10 rounded-3xl shadow-xl text-center"><h1 className="text-4xl font-extrabold mb-4">{testData.title}</h1>
      <input type="text" placeholder="Nhập tên học viên..." value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full max-w-sm mx-auto mb-8 px-4 py-3 border-2 rounded-xl focus:border-blue-600 outline-none text-center font-bold" />
      <button onClick={() => { if (!studentName.trim()) { alert('Nhập tên trước!'); return; } setAppState('test'); }} className="w-full max-w-sm py-4 bg-blue-600 text-white text-lg font-bold rounded-full mb-4">Bắt đầu làm bài</button>
      <button onClick={() => { try{setSubmissions(JSON.parse(localStorage.getItem('ielts_submissions')||'[]'))}catch(e){} setAppState('admin'); }} className="text-slate-500 hover:underline">👨‍🏫 Quản trị viên</button></div></div>
  );

  const renderAdmin = () => (
    <div className="min-h-screen bg-slate-50 p-8"><div className="max-w-6xl mx-auto bg-white p-8 rounded-2xl shadow"><div className="flex justify-between mb-6"><h2 className="text-3xl font-bold">Quản trị</h2><button onClick={() => setAppState('home')} className="px-5 py-2 bg-slate-100 rounded hover:bg-slate-200">Trang chủ</button></div>
      <div className="flex border-b mb-6"><button onClick={() => setAdminMode('ai')} className={`px-6 py-3 font-bold ${adminMode === 'ai' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Tạo Đề Bằng AI</button><button onClick={() => setAdminMode('submissions')} className={`px-6 py-3 font-bold ${adminMode === 'submissions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Bài Làm Học Viên</button></div>
      {adminMode === 'ai' && (
        <div className="grid grid-cols-3 gap-6">{(['listening', 'reading', 'writing'] as const).map(sec => (
          <div key={sec} className="border-2 border-dashed p-6 text-center relative">{processingSection === sec ? <div><SpinnerIcon/><p className="mt-4">{uploadStatus}</p></div> : <div><UploadIcon/><h3 className="font-bold capitalize mb-2">{sec}</h3><p className="text-xs mb-4">File: .txt</p><input type="file" accept=".txt" onChange={(e) => handleFileUpload(e, sec)} className="absolute inset-0 opacity-0 cursor-pointer"/></div>}</div>
        ))}</div>
      )}
      {adminMode === 'submissions' && (
        <div className="flex gap-6 h-[500px]">
          <div className="w-1/3 bg-slate-50 border rounded-xl overflow-y-auto">{submissions.map(sub => <div key={sub.id} onClick={() => setSelectedSubmission(sub)} className="p-4 border-b cursor-pointer hover:bg-slate-100"><div className="font-bold">{sub.studentName}</div><div className="text-blue-600">Band: {sub.scores.overall}</div></div>)}</div>
          <div className="w-2/3 bg-white border rounded-xl p-6 overflow-y-auto">{selectedSubmission ? <div><h4 className="text-2xl font-bold mb-4">{selectedSubmission.studentName}</h4><h5 className="font-bold text-purple-800">Task 1</h5><div className="bg-amber-50 p-4 mb-4 whitespace-pre-wrap">{selectedSubmission.writingAnswers.task1}</div><h5 className="font-bold text-purple-800">Task 2</h5><div className="bg-amber-50 p-4 whitespace-pre-wrap">{selectedSubmission.writingAnswers.task2}</div></div> : <div className="text-slate-400">Chọn bài làm bên trái</div>}</div>
        </div>
      )}
    </div></div>
  );

  const renderTest = () => {
    const sd = testData.sections[currentSection]; if (!sd) return <div>Lỗi dữ liệu</div>;
    return (
      <div className="h-screen flex flex-col bg-slate-100">
        <header className="bg-white p-4 flex justify-between items-center shadow-sm">
          <div className="flex gap-2">{['listening', 'reading', 'writing'].map(s => <div key={s} className={`px-4 py-1.5 rounded-full font-bold uppercase ${currentSection === s ? 'bg-blue-100 text-blue-700' : 'text-slate-400'}`}>{s}</div>)}</div>
          <Timer timeLimit={sd.timeLimit} onTimeUp={() => currentSection === 'writing' ? submitTest() : (currentSection === 'listening' ? setCurrentSection('reading') : setCurrentSection('writing'))} />
          <button onClick={() => setShowSubmitModal(true)} className="px-5 py-2 bg-slate-800 text-white rounded font-bold">Nộp Bài</button>
        </header>
        <div className="flex-1 overflow-hidden flex">
          {currentSection === 'reading' ? (
            <><div className="w-1/2 h-full overflow-y-auto p-8 bg-white border-r">{sd.parts?.map(p => <div key={p.id} className="mb-10"><h2 className="text-2xl font-bold mb-4">{p.title}</h2><div dangerouslySetInnerHTML={{ __html: p.content || '' }} /></div>)}</div><div className="w-1/2 h-full overflow-y-auto p-8 bg-slate-50">{sd.parts?.map(p => <div key={p.id}>{p.questions?.map(q => <QuestionInput key={q.id} question={q} value={answers[q.id]} onChange={handleAnswerChange} />)}</div>)}</div></>
          ) : (
            <div className="w-full max-w-4xl mx-auto h-full overflow-y-auto p-8">{sd.parts?.map(p => <div key={p.id} className="mb-12 bg-white p-8 rounded-xl shadow-sm"><h2 className="text-2xl font-bold mb-4">{p.title}</h2>{p.audioUrl && <AudioPlayer url={p.audioUrl} />}{p.content && <div className="mb-8 whitespace-pre-wrap">{p.content}</div>}{p.questions?.map(q => <QuestionInput key={q.id} question={q} value={answers[q.id]} onChange={handleAnswerChange} />)}</div>)}</div>
          )}
        </div>
        <footer className="bg-white p-4 border-t flex justify-between"><span className="text-slate-500">Lưu tự động</span><button onClick={() => currentSection === 'writing' ? submitTest() : (currentSection === 'listening' ? setCurrentSection('reading') : setCurrentSection('writing'))} className="px-6 py-2 bg-blue-600 text-white rounded font-bold">Tiếp theo</button></footer>
        {showSubmitModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="bg-white p-8 rounded-xl text-center"><h3 className="text-2xl font-bold mb-4">Nộp bài ngay?</h3><div className="flex gap-4 justify-center"><button onClick={() => setShowSubmitModal(false)} className="px-6 py-2 bg-slate-200 rounded">Hủy</button><button onClick={submitTest} className="px-6 py-2 bg-blue-600 text-white rounded">Đồng ý</button></div></div></div>}
      </div>
    );
  };
 
  const renderResults = () => (
    <div className="h-screen flex items-center justify-center bg-slate-50 flex-col"><div className="bg-white p-10 rounded-2xl shadow-xl text-center"><h1 className="text-4xl font-bold text-blue-600 mb-6">Đã nộp bài!</h1><p className="mb-8 text-slate-600">Giáo viên sẽ xem xét phần Writing của bạn.</p><button onClick={() => { setAppState('home'); setAnswers({}); setStudentName(''); }} className="px-8 py-3 bg-slate-800 text-white rounded-full">Trang chủ</button></div></div>
  );

  return appState === 'home' ? renderHome() : appState === 'admin' ? renderAdmin() : appState === 'test' ? renderTest() : renderResults();
}