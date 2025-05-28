import invariant from 'invariant';
import { get } from 'lodash-es';
import { useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import { useIntl } from './context';
import {
  GetByPath,
  LocaleId,
  Paths,
  TranslationLoader,
  TranslationType,
} from './helpers';

function isTranslationLoader(
  input: TranslationType | TranslationLoader
): input is TranslationLoader {
  return typeof input === 'function';
}

export function useTranslationSWR(locale: LocaleId) {
  const dictionaries = useIntl(state => state.dictionaries);
  const translation = dictionaries[locale];
  invariant(
    translation != null,
    `Locale ${locale} is not existed. Please define it first.`
  );
  return useSWRImmutable(
    translation != null
      ? [translation, 'internationalization/use-translation-swr']
      : null,
    ([translation]) =>
      isTranslationLoader(translation) ? translation() : translation
  );
}

export function useTranslation(): TranslationType;
export function useTranslation<TPath extends Paths<TranslationType>>(
  path: TPath
): GetByPath<TranslationType, TPath>;
export function useTranslation(path?: any) {
  const defaultLocale = useIntl(state => state.defaultLocale);
  const locale = useIntl(state => state.locale);
  const { data: defaults } = useTranslationSWR(defaultLocale);
  const { data = defaults } = useTranslationSWR(locale);
  return useMemo(
    () => (data != null && path != null ? get(data, path) : data),
    [data, path]
  );
}
