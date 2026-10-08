import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getAssessmentQuestions, submitAssessment } from '../services/api';
import {
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  BarChart2,
  Clock,
} from 'lucide-react';

export const AssessmentPage = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: selectedOptionIndex }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await getAssessmentQuestions();
        if (data.success && data.questions) {
          setQuestions(data.questions);
        }
      } catch (err) {
        setError(err.message || 'Unable to load diagnostic questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleSelectOption = (questionId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const currentQ = questions[currentIndex];
  const isAnswered = currentQ && answers[currentQ._id] !== undefined;
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const handleSubmit = async () => {
    if (answeredCount < totalQuestions) {
      const confirmSubmit = window.confirm(
        `You have answered ${answeredCount} of ${totalQuestions} questions. Are you sure you want to submit? Unanswered questions will count as incorrect.`
      );
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = questions.map((q) => ({
        questionId: q._id,
        selectedOption: answers[q._id] !== undefined ? answers[q._id] : -1,
      }));

      await submitAssessment(payload);
      // Redirect to student dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to submit assessment');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
        <p className="text-xs text-slate-400 font-mono">Loading diagnostic assessment...</p>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-semibold text-white">Failed to Load Assessment</h3>
        <p className="text-xs text-slate-400">{error}</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      {/* Assessment Header */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart2 className="h-6 w-6 text-brand-500" />
              Diagnostic Placement Assessment
            </h1>
            <p className="text-xs text-slate-400">
              Assessing DSA, OOP, DBMS, OS, and Computer Networks to determine your Placement Readiness Score.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
              {answeredCount} / {totalQuestions} Answered
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
          <div
            className="bg-brand-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Question Card */}
      {currentQ && (
        <Card className="border-slate-800 bg-slate-900/60 shadow-xl">
          <CardHeader className="border-b border-slate-800/80 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-brand-500/10 border border-brand-500/30 text-[11px] font-mono font-semibold text-brand-400 uppercase">
                  {currentQ.category}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
                  {currentQ.difficulty}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
            </div>
            <CardTitle className="text-base sm:text-lg text-slate-100 font-medium pt-3 leading-relaxed">
              {currentQ.question}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 pt-5">
            {currentQ.options.map((option, idx) => {
              const isSelected = answers[currentQ._id] === idx;
              const optionLetters = ['A', 'B', 'C', 'D', 'E'];

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(currentQ._id, idx)}
                  className={`w-full p-4 rounded-xl text-left border transition-all flex items-start gap-3.5 ${
                    isSelected
                      ? 'border-brand-500 bg-brand-500/15 text-white ring-1 ring-brand-500'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <span
                    className={`h-6 w-6 rounded-md text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-brand-500 text-slate-950'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {optionLetters[idx]}
                  </span>
                  <span className="text-xs sm:text-sm pt-0.5 leading-snug">{option}</span>
                </button>
              );
            })}
          </CardContent>

          <CardFooter className="justify-between border-t border-slate-800/80 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </Button>

            <div className="flex items-center gap-2">
              {currentIndex < totalQuestions - 1 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  className="gap-1.5"
                >
                  <span>Next</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmit}
                  isLoading={submitting}
                  className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
                >
                  <span>Submit Assessment</span>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      )}

      {/* Question Selector Quick Grid */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
        <p className="text-xs font-medium text-slate-400 mb-2">Question Navigator</p>
        <div className="flex flex-wrap gap-1.5">
          {questions.map((q, idx) => {
            const answered = answers[q._id] !== undefined;
            const isCurrent = currentIndex === idx;

            return (
              <button
                key={q._id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-7 w-7 rounded-md text-[11px] font-mono font-medium transition-colors ${
                  isCurrent
                    ? 'ring-2 ring-brand-500 bg-brand-500 text-slate-950 font-bold'
                    : answered
                    ? 'bg-slate-800 text-brand-400 border border-brand-500/40'
                    : 'bg-slate-950 text-slate-500 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;
