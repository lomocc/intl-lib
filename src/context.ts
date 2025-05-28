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
import { useTranslationSWR } from './translation';

export interface IntlState {
  /**
   * Default locale ID.
   *
   * This is used when no locale is set or when the current locale is not available in the `dictionaries`.
   *
   * This should match one of the keys in the `dictionaries` object.
   *
   * For example, 'en-US', 'fr-FR', etc.
   *
   * If not provided, it defaults to 'en-US'.
   *
   * This is useful for fallback translations.
   *
   * It ensures that there is always a default translation available.
   * @default 'en-US'
   */
  defaultLocale: LocaleId;
  /**
   * Current locale ID.
   *
   * This is the locale that is currently being used for translations.
   *
   * If the current locale is not available in the `dictionaries`, it will fall back to the `defaultLocale`.
   *
   * For example, 'en-US', 'fr-FR', etc.
   */
  locale: LocaleId;
  /**
   * Dictionaries for each locale.
   *
   * The key is the locale ID, and the value can be either a translation object or a function that returns a translation object.
   *
   * This allows for dynamic loading of translations.
   *
   * If a function is provided, it should return a promise that resolves to the translation object.
   *
   * @example
   * ```
   * {
   *   'en-US': { greeting: 'Hello' },
   *   'fr-FR': () => import('./translations/fr-FR.json').then(module => module.default),
   *   'zh-CN': () => ({ greeting: '你好' }),
   * }
   * ```
   */
  dictionaries: Partial<Record<LocaleId, TranslationType | TranslationLoader>>;
  /**
   * Custom renderers for specific content types.
   *
   * This allows you to define how different types of content should be rendered in your application.
   *
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

export const IntlContext = createContext<IntlStore | null>(null);

export interface IntlProviderProps
  extends Omit<IntlState, 'defaultLocale'>,
    Partial<Pick<IntlState, 'defaultLocale'>> {}

/**
 * IntlProvider component provides the context for internationalization.
 * @see {@link useIntl}
 */
export function IntlProvider({
  defaultLocale = 'en-US',
  locale,
  dictionaries,
  renderers,
  children,
}: PropsWithChildren<IntlProviderProps>) {
  const storeRef = useRef<IntlStore>(null);
  if (!storeRef.current) {
    invariant(
      dictionaries[defaultLocale] != null,
      `Missing default locale dictionary for ${defaultLocale}, please provide it in the dictionaries.`
    );
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

/**
 * useIntlStore hook allows you to access the Intl context.
 * @remarks This method is not recommended for general usage.
 * @see {@link IntlStore}
 * @private
 */
export function useIntlStore() {
  const intlStore = useContext(IntlContext);
  invariant(intlStore != null, 'Missing IntlProvider');
  return intlStore;
}

/**
 * useIntl hook allows you to access the internationalization store.
 * @example
 * ```tsx
 * function MyComponent() {
 *  const locale = useIntl(state => state.locale);
 *  const setLocale = useIntl(state => state.setLocale);
 *  return (
 *    <>
 *      <p>Current locale: {locale}</p>
 *      <button onClick={() => setLocale('fr-FR')}>Switch to French</button>
 *    </>
 *  );
 * }
 */
export function useIntl(): Pick<
  ExtractState<IntlStore>,
  'defaultLocale' | 'locale' | 'setLocale'
>;
export function useIntl<T>(
  selector: (
    state: Pick<
      ExtractState<IntlStore>,
      'defaultLocale' | 'locale' | 'setLocale'
    >
  ) => T
): T;
export function useIntl(selector?: (...args: any) => any) {
  const intlStore = useIntlStore();
  return selector ? useStore(intlStore, selector) : useStore(intlStore);
}
