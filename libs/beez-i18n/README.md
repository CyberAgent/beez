beez-i18n
=========

# About

It's a small library to provide the I18n translations on the Beez.

@see [http://www.w3.org/International/O-charset-lang.html](http://www.w3.org/International/O-charset-lang.html)

# example

## case 1 (browser language: ja)

```javascript
beez.createI18n(beez.I18n, {
  'en': {
    'hello': 'hello'
  },
  'ja': {
    'hello': 'こんにちは'
  }
});

var message = beez.i18n.getMessage('hello');

console.log(message);
> 'こんにちは'
```

## case 2 (browser language: ja)

```javascript
beez.createI18n(beez.I18n, {
  'en': {
    'welcome_me': 'welcome {#me} {#message}'
  },
  'ja': {
    'welcome_me': 'ようこそ {#me} {message}'
  }
});

var message = beez.i18n.getMessage('welcome_me', 'fkei', ':)');

console.log(message);
> 'ようこそ fkei :)'
```

# Build

```
$ make
```

# jshint

```
$ make jshint
```

# Test

```
$ make init # or make
$ $ open ./spec/all.html # browser access
```

# License

```
@override beez
```
