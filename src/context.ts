import invariant from 'invariant';
import {
  createContext,
  createElement,
  FC,
  PropsWithChildren,
  useContext,
  useRef,
} from 'react';
import { createStore, ExtractState, useStore } from 'zustand';
import { LocaleId, TranslationLoader, TranslationType } from './helpers';
import { useTranslationSWR } from './use-translation';

export interface IntlState {
  /**
   * Default locale ID.
   * This is used when no locale is set or when the current locale is not available in the `dictionaries`.
   * This should match one of the keys in the `dictionaries` object.
   * @default 'en-US'
   */
  defaultLocale: LocaleId;
  /**
   * Current locale ID.
   * It should also match the keys in the `dictionaries` object.
   * For example, 'en-US', 'fr-FR', etc.
   */
  locale: LocaleId;
  /**
   * Dictionaries for each locale.
   * The key is the locale ID, and the value can be either a translation object or a function that returns a translation object.
   * This allows for dynamic loading of translations.
   * If a function is provided, it should return a promise that resolves to the translation object.
   * @example
   * ```
   * {
   *   'en-US': { greeting: 'Hello' },
   *   'fr-FR': () => import('./translations/fr-FR.json'),
   *   'zh-CN': () => ({ greeting: '你好' }),
   * }
   * ```
   */
  dictionaries: Partial<Record<LocaleId, TranslationType | TranslationLoader>>;
  /**
   * Custom renderers for specific content types.
   * The key is the content type (e.g., 'md', 'mdx', 'markdown', 'img', 'image', 'svg', 'html'), and the value is a React functional component that renders the content.
   */
  renderers?: Record<string, FC<{ content: string }>>;
}

export interface IntlAction {
  setLocale: (locale: LocaleId) => void;
}

const createIntlStore = (initialProps: IntlState) => {
  return createStore<IntlState & IntlAction>()(set => ({
    ...initialProps,
    setLocale: locale => set({ locale }),
  }));
};

export type IntlStore = ReturnType<typeof createIntlStore>;

const IntlContext = createContext<IntlStore | null>(null);

export interface IntlProviderProps
  extends Omit<IntlState, 'defaultLocale'>,
    Partial<Pick<IntlState, 'defaultLocale'>> {}

export function IntlProvider({
  defaultLocale = 'en-US',
  locale,
  dictionaries,
  renderers,
  children,
}: PropsWithChildren<IntlProviderProps>) {
  const storeRef = useRef<IntlStore>(null);
  if (!storeRef.current) {
    storeRef.current = createIntlStore({
      defaultLocale,
      locale,
      dictionaries,
      renderers,
    });
  }
  return createElement(
    IntlContext.Provider,
    { value: storeRef.current },
    createElement(IntlInitializer, null, children)
  );
}

function IntlInitializer({ children }: PropsWithChildren) {
  const defaultLocale = useIntl(state => state.defaultLocale);
  const { data, error } = useTranslationSWR(defaultLocale);
  return data != null && error == null ? children : null;
}

export function useIntl(): ExtractState<IntlStore>;
export function useIntl<T>(selector: (state: ExtractState<IntlStore>) => T): T;
export function useIntl(selector?: (...args: any) => any) {
  const storeApi = useContext(IntlContext);
  invariant(storeApi != null, 'Missing IntlProvider');
  return selector ? useStore(storeApi, selector) : useStore(storeApi);
}
