import { FormEvent, useState } from 'react';
import { useLocale } from '../hooks/useLocale';

export function LoginPage() {
  const { t } = useLocale();
  const [email, setEmail] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    localStorage.setItem('testamente:user', email);
  }

  return (
    <section className="stack">
      <h2>{t('login.title')}</h2>
      <p>{t('login.description')}</p>
      <form className="stack" onSubmit={handleSubmit}>
        <label>
          {t('login.email')}
          <input value={email} type="email" required onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          {t('login.password')}
          <input type="password" required />
        </label>
        <button type="submit">{t('login.submit')}</button>
      </form>
    </section>
  );
}
