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

Create your translation JSON file, for example `dictionaries/en-US.json`:

```json
{
  "greeting": "Hello"
}
```

- Extend the Translation Type

Create a type that extends the base translation type provided by the library:

```ts
import en_US from './dictionaries/en-US.json';

type TranslationTypeImpl = typeof en_US;

declare module 'intl-lib' {
  interface TranslationType extends TranslationTypeImpl {}
}
```

1. Wrap Your App with InternationalizationProvider

Before using the translation components or hooks, wrap your application with the provider, supplying the translations and optionally the default locale:

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
        'fr-FR': () => import('./dictionaries/fr-FR.json'),
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
  const greetings = useTranslation('greetings');
  return (
    <>
      <pre>{greetingText}</pre>
      <pre>{greetings.morning}</pre>
      <Translation path="greetings.morning" />
    </>
  );
}
```
