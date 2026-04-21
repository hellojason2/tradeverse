/**
 * Copy-to-clipboard with Sonner toast feedback.
 * Uses navigator.clipboard when available; falls back to a hidden textarea.
 * See BEHAVIOR.md §7 for the rule.
 */
import { toast } from 'sonner';
import i18n from '@/i18n';

export interface CopyOptions {
  /** Human label describing what was copied (e.g. "TX hash", "Wallet address"). */
  label?: string;
}

export async function copyWithToast(
  value: string,
  options: CopyOptions = {}
): Promise<boolean> {
  const label =
    options.label ??
    i18n.t('common.clipboard.defaultLabel', { defaultValue: 'Value' });
  const success = await copyToClipboard(value);
  if (success) {
    toast.success(
      i18n.t('common.clipboard.copied', { defaultValue: '{{label}} copied', label }),
      { duration: 2000 }
    );
  } else {
    toast.error(
      i18n.t('common.clipboard.failed', { defaultValue: 'Copy failed' }),
      { duration: 2500 }
    );
  }
  return success;
}

async function copyToClipboard(value: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // fall through to textarea fallback
    }
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
