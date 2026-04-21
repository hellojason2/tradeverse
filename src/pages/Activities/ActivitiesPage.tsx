import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function ActivitiesPage() {
  const { t } = useTranslation('stubs');
  useDocumentTitle(t('activities.title'));
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold mb-2">{t('activities.title')}</h1>
      <p className="text-muted-foreground mb-8">{t('activities.subtitle')}</p>
      <p className="text-sm text-muted-foreground">{t('stubs.comingSoon')}</p>
    </div>
  );
}
