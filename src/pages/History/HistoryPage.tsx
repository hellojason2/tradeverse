import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function HistoryPage() {
  const { t } = useTranslation('stubs');
  useDocumentTitle(t('history.title'));
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold mb-2">{t('history.title')}</h1>
      <p className="text-muted-foreground mb-8">{t('history.subtitle')}</p>
      <p className="text-sm text-muted-foreground">{t('stubs.comingSoon')}</p>
    </div>
  );
}
