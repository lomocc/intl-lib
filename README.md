# intl-lib

A lightweight, type-safe React internationalization (intl) library that leverages JSON translation files and provides strong typing with nested path support.

## Installation

```bash
npm install intl-lib
# or
yarn add intl-lib
```

## Usage

- Define Your Translation JSON

Create JSON files for each locale in a `dictionaries` directory. For example, create `en-US.json` and `fr-FR.json`:

```json
{
  "greeting": "Hello"
}
```

- Extend the Base Translation Type

To ensure type safety, extend the base translation type provided by `intl-lib` with your custom translations. This allows you to use TypeScript to catch errors in translation keys.

```ts
import en_US from './dictionaries/en-US.json';

type TranslationTypeImpl = typeof en_US;

declare module 'intl-lib' {
  interface TranslationType extends TranslationTypeImpl {}
}
```

- Wrap Your Application with the IntlProvider

```tsx
import { IntlProvider } from 'intl-lib';
import en_US from './dictionaries/en-US.json';

function App() {
  return (
    <IntlProvider
      defaultLocale="en-US"
      locale="fr-FR"
      dictionaries={{
        'en-US': en_US,
        'fr-FR': () =>
          import('./dictionaries/fr-FR.json').then(module => module.default),
        'zh-CN': () => ({ greeting: '你好' }),
        // Add other locales here
      }}
    >
      {/* Your app components */}
    </IntlProvider>
  );
}
```

- Use the `Translation` component or `useTranslation` hook to translate keys — `nested paths` like `"greetings.morning"` are also supported.

```tsx
import { Translation } from 'intl-lib';

function Page() {
  const greetingText = useTranslation('greeting');
  return (
    <>
      <pre>{greetingText}</pre>
      <Translation path="greetings.morning" />
    </>
  );
}
```
