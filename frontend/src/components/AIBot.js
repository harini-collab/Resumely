import { useState, useEffect } from 'react';
import './AIBot.css';

const TIPS = [
  "Add measurable achievements: 'Increased sales by 32%' beats 'Improved sales'.",
  'Tailor your resume for each job and use exact role keywords naturally.',
  'List 8-12 skills relevant to your target role for better ATS matching.',
  'Keep your resume to 1 page if you have under 5 years of experience.',
  'Put your strongest bullet point first in each role.',
  'Use active verbs: Built, Led, Designed, Optimized, Delivered.',
];

export default function AIBot({ context = '' }) {
  const [open, setOpen] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Hi, I'm your Resumely assistant. Ask me how to improve your resume, match a job, or write stronger bullet points.",
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setTipIdx(i => (i + 1) % TIPS.length);
        setVisible(true);
      }, 400);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const buildReply = (text) => {
    const q = text.toLowerCase();
    if (q.includes('ats') || q.includes('score')) {
      return 'For a better ATS score, use standard headings, mirror the job description keywords, add measurable results, and avoid tables or graphics.';
    }
    if (q.includes('skill') || q.includes('job')) {
      return 'Put your strongest matching skills in the top third of the resume, then support them with projects or work examples.';
    }
    if (q.includes('bullet') || q.includes('experience')) {
      return 'Use this format: action verb + what you did + measurable result. Example: Built an onboarding dashboard that reduced reporting time by 40%.';
    }
    if (q.includes('summary') || q.includes('profile')) {
      return 'Keep your summary to 2-3 lines: role, strengths, key skills, and the outcome you create. Avoid generic claims.';
    }
    if (q.includes('upload')) {
      return 'Open Upload Resume, choose your file, select a target role, and run the analysis. I will stay available while you review results.';
    }
    return 'Good question. Focus on clarity, relevant keywords, and measurable proof. Tell me the role you are targeting and I can suggest stronger wording.';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [
      ...prev,
      { role: 'user', text },
      { role: 'bot', text: buildReply(text) },
    ]);
    setInput('');
  };

  return (
    <div className={`ai-bot-container ${open ? 'open' : ''}`}>
      {open && (
        <div className="ai-bot-panel">
          <div className="ai-bot-header">
            <div className="ai-bot-avatar-sm">AI</div>
            <div>
              <div className="ai-bot-name">Resumely Bot</div>
              <div className="ai-bot-status"><span className="status-dot" /> Online</div>
            </div>
            <button className="ai-bot-close" onClick={() => setOpen(false)}>x</button>
          </div>

          <div className="ai-bot-body">
            <div className="ai-bot-chat">
              {messages.map((m, i) => (
                <div key={i} className={`ai-message ${m.role}`}>
                  {m.text}
                </div>
              ))}
            </div>

            <form className="ai-bot-form" onSubmit={handleSubmit}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about your resume..."
                aria-label="Ask Resumely Bot"
              />
              <button type="submit">Send</button>
            </form>

            <div className={`ai-bot-tip ${visible ? 'visible' : ''}`}>
              {TIPS[tipIdx]}
            </div>
            <div className="ai-bot-context">
              {context || 'Tip: ask me about ATS score, skills, summaries, or bullet points.'}
            </div>
          </div>
        </div>
      )}
      <button className="ai-bot-fab" onClick={() => setOpen(v => !v)} title="AI Resume Assistant">
        <span className="ai-bot-fab-icon">AI</span>
        {!open && <span className="ai-bot-fab-badge" />}
      </button>
    </div>
  );
}
