/**
 * @module global
 *
 * Global ambient type augmentations. Types the next-intl message catalog
 * against the English catalog so `useTranslations`/`getTranslations` keys
 * are checked at compile time.
 */
import type en from '../messages/en.json';

type Messages = typeof en;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- next-intl augmentation contract
  interface IntlMessages extends Messages {}
}
