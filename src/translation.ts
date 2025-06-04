import invariant from 'invariant';
import { get } from 'lodash-es';
import React, { createElement, useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import { useDeepCompareMemoize } from 'use-deep-compare-effect';
import { useStore } from 'zustand';
import { useIntlStore } from './context';
import {
  GetByPath,
  LeafPaths,
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
  const intlStore = useIntlStore();
  const dictionaries = useStore(intlStore, state => state.dictionaries);
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

/**
 * This hook allows you to retrieve translations based on a given path and optional parameters.
 * @example
 * ```ts
 * const greeting = useTranslation('greeting.hello', { name: 'John' });
 * ```
 */
export function useTranslation(): TranslationType;
export function useTranslation<TPath extends Paths<TranslationType>>(
  path: TPath,
  params?: Record<string, any>,
  localeOverride?: LocaleId
): GetByPath<TranslationType, TPath>;
export function useTranslation(path?: any, params?: any, localeOverride?: any) {
  const intlStore = useIntlStore();
  const defaultLocale = useStore(intlStore, state => state.defaultLocale);
  const locale = useStore(intlStore, state => state.locale);
  const { data: defaults } = useTranslationSWR(defaultLocale);
  const { data = defaults } = useTranslationSWR(localeOverride ?? locale);
  const translation = useMemo(
    () => (data != null && path != null ? get(data, path) : data),
    [data, path]
  );
  const memoizedParams = useDeepCompareMemoize(params);
  const content = useMemo(
    () =>
      memoizedParams != null && typeof translation === 'string'
        ? translation.replace(
            /\$\{\s*([\w.]+)\s*\}/g,
            (match, key) => get(memoizedParams, key) ?? match
          )
        : translation,
    [translation, memoizedParams]
  );
  return content;
}

export interface TranslationProps<
  TPath extends LeafPaths<TranslationType>,
  P extends any = {}
> {
  /**
   * The property path of the translation.
   * This should match the structure of your translation object.
   * For example, 'greeting.hello' for a translation object like { greeting: { hello: 'Hello' } }
   */
  path: TPath;
  /**
   * Parameters to evaluate in the translation.
   * This can be used to replace placeholders in the translation string.
   * For example, if your translation string is 'Hello, ${name}!', you can pass { name: 'John' } here.
   */
  params?: Record<string, any>;
  /**
   * Override the locale for this translation.
   * This is useful when you want to render a translation in a different locale than the current one.
   * For example, if your current locale is 'en-US' but you want to render a translation in 'fr-FR',
   */
  localeOverride?: LocaleId;
  renderer?: React.FC<{ content: string } & P>;
  rendererProps?: P;
}

const availableTypes = ['md', 'mdx', 'markdown', 'img', 'image', 'svg', 'html'];

const matchRegex = new RegExp(`^\\[(${availableTypes.join('|')})\\](.*)$`);

/**
 * This component is used to render translations based on a given path and optional parameters.
 * @see {@link useTranslation}
 * @example
 * ```tsx
 * <Translation path="greeting.hello" params={{ name: 'John' }} />
 * ```
 */
export function Translation<TPath extends LeafPaths<TranslationType>>({
  path,
  params,
  localeOverride,
  renderer: rendererOverride,
  rendererProps,
}: TranslationProps<TPath>) {
  const intlStore = useIntlStore();
  const renderers = useStore(intlStore, state => state.renderers);
  const content = useTranslation(path, params, localeOverride) as string;
  const match = useMemo(() => content.match(matchRegex), [content]);
  if (match != null) {
    const type = match[1];
    const content = match[2];
    const renderer = rendererOverride ?? renderers?.[type];
    invariant(
      renderer != null,
      `Renderer ${type} is not existed. Please define it first.`
    );
    return createElement(renderer, { content, ...rendererProps });
  }
  if (rendererOverride != null) {
    return createElement(rendererOverride, { content, ...rendererProps });
  }
  return content;
}

/**
 * This function is a shorthand for the `Translation` component.
 * @see {@link Translation}
 * @example
 * ```tsx
 * function MyComponent() {
 *   return <pre>{t('greeting.hello')}</pre>;
 * }
 * ```
 */
export function t<TPath extends LeafPaths<TranslationType>>(
  /**
   * The property path of the translation.
   * This should match the structure of your translation object.
   * For example, 'greeting.hello' for a translation object like { greeting: { hello: 'Hello' } }
   */
  path: TPath,
  /**
   * Parameters to evaluate in the translation.
   * This can be used to replace placeholders in the translation string.
   * For example, if your translation string is 'Hello, ${name}!', you can pass { name: 'John' } here.
   */
  params?: Record<string, any>,
  /**
   * Override the locale for this translation.
   * This is useful when you want to render a translation in a different locale than the current one.
   * For example, if your current locale is 'en-US' but you want to render a translation in 'fr-FR',
   */
  localeOverride?: LocaleId
) {
  return createElement(Translation, {
    path,
    params,
    localeOverride,
  });
}
