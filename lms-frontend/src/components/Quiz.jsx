import { useState } from 'react';
import { quizzesAPI } from '../services/api';
import { Award, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Quiz = ({ 
  lesson, 
  onQuizComplete, 
  onQuizPassed 
}) => {
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleQuizAnswer = (questionIndex, answerIndex) => {
    if (quizSubmitted) return;
    
    setQuizAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const handleQuizSubmit = async () => {
    try {
      setSubmitting(true);
      const response = await quizzesAPI.submitQuiz(lesson._id, {
        answers: quizAnswers
      });
      
      const quizResult = response.data?.data || response.data;
      const { score, passed } = quizResult;
      
      setQuizScore(score);
      setQuizSubmitted(true);
      
      if (passed) {
        toast.success(`Quiz passed! Score: ${score}%`);
        onQuizPassed?.();
      } else {
        toast.error(`Quiz failed. Score: ${score}% - Minimum 70% required`);
      }

      onQuizComplete?.(score, passed);
    } catch (error) {
      console.error('Quiz submission error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  if (!lesson.quizQuestions || lesson.quizQuestions.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 inline" />
        <span className="text-yellow-700">No quiz questions available</span>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Quiz Assessment</h3>
        <span className="text-sm text-gray-500">
          {lesson.quizQuestions.length} question{lesson.quizQuestions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {quizSubmitted ? (
        <div className="text-center py-8">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            quizScore >= 70 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            <Award className="w-8 h-8" />
          </div>
          <h4 className="text-xl font-semibold mb-2">
            {quizScore >= 70 ? 'Quiz Passed!' : 'Quiz Failed'}
          </h4>
          <p className="text-gray-600 mb-4">
            Your score: <span className="font-bold">{quizScore}%</span>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Minimum passing score: 70%
          </p>
          {quizScore < 70 ? (
            <button
              onClick={resetQuiz}
              className="btn-primary"
            >
              Try Again
            </button>
          ) : (
            <p className="text-green-600 font-medium">
              You can proceed to the next lesson
            </p>
          )}
        </div>
      ) : (
        <>
          {lesson.quizQuestions.map((question, qIndex) => (
            <div key={qIndex} className="mb-6 p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium mb-3 text-gray-900">
                {qIndex + 1}. {question.question}
              </h4>
              <div className="space-y-2">
                {question.options?.map((option, oIndex) => (
                  <label 
                    key={oIndex} 
                    className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                      quizAnswers[qIndex] === oIndex
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${qIndex}`}
                      checked={quizAnswers[qIndex] === oIndex}
                      onChange={() => handleQuizAnswer(qIndex, oIndex)}
                      className="mr-3 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
              {question.points && (
                <div className="mt-2 text-sm text-gray-500">
                  Points: {question.points}
                </div>
              )}
            </div>
          ))}

          <div className="space-y-3">
            <button
              onClick={handleQuizSubmit}
              disabled={
                submitting || 
                Object.keys(quizAnswers).length !== lesson.quizQuestions.length
              }
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>

            <p className="text-sm text-gray-500 text-center">
              {Object.keys(quizAnswers).length} of {lesson.quizQuestions.length} questions answered
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Quiz;