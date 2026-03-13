import { Link } from 'react-router-dom';
import type { PsychologicalTest } from '../../types/test';

interface TestCardProps {
  test: PsychologicalTest;
  t: (key: string) => string;
}

export function TestCard({ test, t }: TestCardProps) {
  return (
    <article className="card">
      <h3>{t(test.titleKey)}</h3>
      <p>{t(test.descriptionKey)}</p>
      <small>{test.estimatedMinutes} min</small>
      <Link to={`/tests/${test.id}`} className="button-link">
        {t('test.start')}
      </Link>
    </article>
  );
}
