import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const langs = [{ code: 'en', label: 'EN' }, { code: 'vi', label: 'VI' }];
  return (
    <div className={cn('flex items-center gap-[2px] bg-[var(--bg-2,rgba(255,255,255,0.05))] border border-[var(--line-2,rgba(255,255,255,0.1))] rounded-lg p-[2px]', className)}>
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => i18n.changeLanguage(l.code)}
          className={cn(
            'px-2 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer',
            i18n.language?.startsWith(l.code)
              ? 'bg-[var(--accent,#4f8eff)] text-white'
              : 'text-[var(--ink-3,#5a607a)] hover:text-[var(--ink-0,#f5f7ff)]'
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
