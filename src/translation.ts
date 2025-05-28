import invariant from 'invariant';
import { get } from 'lodash-es';
import React, { createElement, useMemo } from 'react';
import { useDeepCompareMemoize } from 'use-deep-compare-effect';
import { useIntl } from './context';
import { LeafPaths, TranslationType } from './helpers';
import { useTranslation } from './use-translation';

export interface TranslationProps<
  TPath extends LeafPaths<TranslationType>,
  P extends any = {}
> {
  path: TPath;
  params?: Record<string, any>;
  renderer?: React.FC<{ content: string } & P>;
  rendererProps?: P;
}

const availableTypes = ['md', 'mdx', 'markdown', 'img', 'image', 'svg', 'html'];

const matchRegex = new RegExp(`^\\[(${availableTypes.join('|')})\\](.*)$`);

export function Translation<TPath extends LeafPaths<TranslationType>>({
  path,
  params,
  renderer: overrideRenderer,
  rendererProps,
}: TranslationProps<TPath>) {
  const renderers = useIntl(state => state.renderers);
  const memoizedParams = useDeepCompareMemoize(params);
  const translationSource: string = useTranslation(path);
  invariant(
    typeof translationSource == 'string',
    `Invalid translation: ${path}`
  );
  const content = useMemo(
    () =>
      memoizedParams != null
        ? translationSource.replace(
            /\$\{\s*([\w.]+)\s*\}/g,
            (match, key) => get(memoizedParams, key) ?? match
          )
        : translationSource,
    [translationSource, memoizedParams]
  );
  const match = useMemo(() => content.match(matchRegex), [content]);
  if (match != null) {
    const type = match[1];
    const content = match[2];
    const renderer = overrideRenderer ?? renderers?.[type];
    invariant(
      renderer != null,
      `Renderer ${type} is not existed. Please define it first.`
    );
    return createElement(renderer, { content, ...rendererProps });
  }
  if (overrideRenderer != null) {
    return createElement(overrideRenderer, { content, ...rendererProps });
  }
  return content;
}
