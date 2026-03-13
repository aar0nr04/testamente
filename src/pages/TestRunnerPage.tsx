import { FormEvent, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTestById } from '../data/tests';
import { calculateResult } from '../engine/testEngine';
import { useLocale } from '../hooks/useLocale';

export function TestRunnerPage() {
  const { testId = '' } = useParams();
  const test = useMemo(() => getTestById(testId), [testId]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { t } = useLocale();

  if (!test) return <p>Test not found.</p>;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const result = calculateResult(test, answers);
    sessionStorage.setItem(`testamente:result:${result.id}`, JSON.stringify(result));
    navigate(`/results/${result.id}?testId=${test.id}`);
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      <h2>{t(test.titleKey)}</h2>
      {test.questions.map((question) => (
        <fieldset key={question.id}>
          <legend>{t(question.promptKey)}</legend>
          {question.options.map((option) => (
            <label key={option.id} className="option-row">
              <input
                type="radio"
                name={question.id}
                value={option.id}
                checked={answers[question.id] === option.id}
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    [question.id]: event.target.value,
                  }))
                }
                required
              />
              <span>{t(option.labelKey)}</span>
            </label>
          ))}
        </fieldset>
      ))}
      <button type="submit">{t('test.submit')}</button>
    </form>
  );
}
