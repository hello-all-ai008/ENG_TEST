import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, ArrowRight, RotateCcw, Award, CheckCircle2, XCircle, Volume2, Home, Settings2 } from 'lucide-react';
import './App.css';

interface Question {
  id: number;
  level: string;
  type: 'Text' | 'Audio';
  content: string;
  audio_url?: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

const API_BASE_URL = 'http://localhost:5000/api';

const App: React.FC = () => {
  const [level, setLevel] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);

  const levels = ['Basic', 'Easy', 'Medium', 'Hard', 'TOEFL', 'TOEIC'];

  useEffect(() => {
    if (level) {
      fetchQuestions();
    }
  }, [level]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/questions`, {
        params: { level, count: questionCount }
      });
      setQuestions(response.data);
      setCurrentIndex(0);
      setScore(0);
      setShowResults(false);
      setIsAnswered(false);
      setSelectedOption(null);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    if (option === questions[currentIndex].correct_answer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  const resetTest = () => {
    setLevel(null);
    setQuestions([]);
    setShowResults(false);
  };

  const goHome = () => {
    setLevel(null);
    setQuestions([]);
    setShowResults(false);
    setCurrentIndex(0);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="subtitle">Loading questions...</div>
        </div>
      </div>
    );
  }

  if (!level) {
    return (
      <div className="container">
        <h1 className="title">English Testing Platform</h1>
        <p className="subtitle">Select your proficiency level and set number of questions.</p>
        
        <div className="config-section">
          <div className="input-group">
            <Settings2 size={18} color="#64748b" />
            <label htmlFor="count" style={{ color: '#64748b', fontSize: '0.9rem' }}>Number of questions:</label>
            <input 
              id="count"
              type="number" 
              min="1" 
              max="50" 
              value={questionCount} 
              onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
              className="input-field"
            />
          </div>
        </div>

        <div className="grid">
          {levels.map(l => (
            <button key={l} onClick={() => setLevel(l)} className="btn btn-outline">
              <BookOpen size={18} />
              {l}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <Award size={64} color="#3b82f6" style={{ marginBottom: '1rem' }} />
          <h2 className="title">Test Completed!</h2>
          <p className="subtitle">Level: {level}</p>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', margin: '1rem 0' }}>
            {score} / {questions.length}
          </div>
          <p className="subtitle">You scored {percentage}%</p>
          <div className="grid">
            <button onClick={fetchQuestions} className="btn btn-primary">
              <RotateCcw size={18} /> Try Again
            </button>
            <button onClick={resetTest} className="btn btn-outline">
              <Home size={18} /> Main Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) return null;

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', color: '#64748b' }}>
          <button onClick={goHome} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            <Home size={16} /> Home
          </button>
          <div style={{ textAlign: 'right' }}>
            <div>Level: <strong>{level}</strong></div>
            <div style={{ fontSize: '0.875rem' }}>Question {currentIndex + 1} of {questions.length}</div>
          </div>
        </div>

        {currentQuestion.type === 'Audio' && (
          <div className="audio-container">
            <Volume2 size={24} color="#3b82f6" />
            <audio controls src={currentQuestion.audio_url} style={{ flexGrow: 1 }} />
          </div>
        )}

        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          {currentQuestion.content}
        </h3>

        <div className="options">
          {currentQuestion.options.map((option, idx) => {
            let className = 'option-btn';
            if (isAnswered) {
              if (option === currentQuestion.correct_answer) {
                className += ' correct';
              } else if (option === selectedOption) {
                className += ' incorrect';
              }
            }

            return (
              <button
                key={idx}
                className={className}
                onClick={() => handleOptionSelect(option)}
                disabled={isAnswered}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'inherit' }}>{option}</span>
                  {isAnswered && option === currentQuestion.correct_answer && <CheckCircle2 size={18} color="#10b981" />}
                  {isAnswered && option === selectedOption && option !== currentQuestion.correct_answer && <XCircle size={18} color="#ef4444" />}
                </div>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="explanation-card">
            <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)' }}>
              Explanation
            </h4>
            <p style={{ margin: 0, color: '#475569' }}>{currentQuestion.explanation}</p>
          </div>
        )}

        {isAnswered && (
          <div style={{ marginTop: '2rem', textAlign: 'right' }}>
            <button onClick={handleNext} className="btn btn-primary">
              {currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
