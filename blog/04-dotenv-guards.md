---
title: 'Using dotenv-guards library for environment variables management'
description: 'At this article I'll share about dotenv-guards library and how it solves our issues in current project'
author: @vitalics
tags: ['Node.js', 'dotenv', 'dotenv-guards', 'typescript']
date: 19 June 2022
edited: 18 October 2022
---

# Using dotenv-guards library for environment variables management

## Table of contents

- [Context](#context)
- [Before](#before)
- [Implementation](#implementation)
- [After](#after)
- [Conclusion](#conclusion)
- [Last Words](#last-words)

## Context

My previous project was very huge and complex, we're working on automotive industry and our mission - make users happy with minimal involving. The user should fullfil financial info and upload driver license - and then he can purchase any car, matched by his financial capabilities. As I mentioned before - this is huge project with a lot of involving teams. On this project my role - lead and drive core changes of automation framework.

While I was on this project automation team facing with a problem, which is that we have a lot of environment variables, which should be parsed by rules, e.g. `jobsCount`, `browser` etc. . We need to manage them in a way, which is easy to use and easy to change.

Let's see how it was before the library usage.

## Before

We use `dotenv` to parse and load environment variables to `process.env` object.

How it was before refactoring.

``` ts
// filename = some_test.ts

process.env.SOME_VARIABLE === 'first' ? true : false
```

## Implementation

We define all `process.env` variables and creates utility with name `env` and writes function to load and register

How it was:

```txt
`package.json - dependencies
`src
  `utils
    `index.ts - exports functions from `env` module
    `env
       `register.ts - this file is responsible for loading and parse env variables
       `index.ts - exported variables are used in `register.ts`
...

```

Let's deep dive into `index.ts` file:

``` ts
// filename = src/utils/env/index.ts
export let RETRY_COUNT = process.env.RETRY_COUNT;
export let BROWSER = 'chrome';
... // other variables
```

But this variables are predefined and if engineer set them with wrong values - we get an unexpected error or even behavior.

Example:

```typescript
import { RETRY_COUNT } from './index.ts';
// filename = src/utils/env/register.ts
export default function register(){
  dotenv.load() // loads .env file
  RETRY_COUNT = +process.env.RETRY_COUNT;
}
```

The problem here with parsing is that we have a lot of variables with various requirements, e.g. numeric value, should be Finite and valid number, string always should be a subset of enum, etc.

The next step is creating utility function to transform by predefined rules.

Example:

``` ts
// filename = src/utils/env/guards/number

type Options = {
  // project specific options for all numerics types
}

export default function numberGuard(variable: string | undefined, options: Options){
  const numberLike = Number(variable);
  let result: number;
  // do specifics transformations and set result variable
  return result;
}
```

Usage in register file

``` ts
// filename = 'src/utils/env/register'
import { RETRY_COUNT } from './index.ts';
import numberGuard from './guards/number';

export default function register(){
  dotenv.load() // loads .env file
  RETRY_COUNT = numberGuard(process.env.RETRY_COUNT);
}
```

Pros

- we are sure that exact `process.env` variable has been parsed correctly.

Cons:

- for each groups we shall creates new guard, e.g. `numberGuard`, `projectSpecificGuard1`, `projectSpecificGuard2` , etc.
- we need to create tests for each guard.
- supports only project needs guards.
- we are not handle objects, arrays, since `env` variables are described with primitives, in mostly cases is OK, but we are not 100% sure about it :)

## After

We made a decision to write own dotenv guards and make it open source.

We was focusing on routine transformations. For numbers it is: `undefined`, `finite` and `safe`

getting started:
`npm install dotenv-guards`

using in our project:

``` ts
// utils/env/register.ts
import {config} from 'dotenv';
import {numberGuard} from 'dotenv-guards';

export default function register(){
  // load env variable
  load();
  // required variable, throws an error if `process.env.RETRY_COUNT` is not defined
  RETRY_COUNT = numberGuard(process.env.RETRY_COUNT, {throwOnFinite: true, throwOnUndefined: true, fallback: 0});

  // JOB_COUNT variable will be always defined, since fallback value is provided
  JOB_COUNT = numberGuard(process.env.JON_COUNT, { fallback: 0 });

}
```

### Why dotenv-guards useful?

Well, our API provides fallback value in case of errors, it makes more flexible.

Also, From 2 version - I'll provides `define` and `revoke` functions, so if you feel like primitives are not enough - you may define own guard.

Example:

``` ts
import { define, revoke } from 'dotenv-guards';

const jsonGuard = define((envVariable: string | undefined) => {
  // checks that variable is exists and not undefined

  const parsed = JSON.parse(envVariable);
  return parsed;
});

// using guard

const res = jsonGuard('{"qwe": true}'); // returns {"qwe": true}

// or when jsonGuard is no need anymore - use revoke function, it will allocates memory, since it uses proxy.revoke under the hood.

revoke(jsonGuard);

// it you want to call after revoked - you will get TypeError.

jsonGuard('{"qwe": true}'); // TypeError. since it was revoked
```

The reason why `define` function is exists - is making sure that first argument is env-like(`string | undefined`)

## Conclusion

As for me - the best way to implementing `env` module is creating an object and JSON schema definitions. Since JSON schema has standards and more flexible.

For example, I'll take [`class-validator`](https://github.com/typestack/class-validator) package. Or take [`ajv`](https://www.npmjs.com/package/ajv) to validate items, but also i'll pickup `dotenv-guards`. The reason why i am using it is simple - json schema used for making sure about object format, but `dotenv-guards` is used for transformations.

It will look like:

``` ts
// example takes from
// https://github.com/typestack/class-validator#usage

// filename = 'src/utils/env.ts'

import {
  validate,
  validateOrReject,
  IsInt,
  Length,
  IsEmail,
  IsFQDN,
  IsDate,
  Min,
  Max,
} from 'class-validator';

class Environment {
  @IsInt()
  @Min(0)
  @Max(10)
  jobCount: number;

  @IsEmail()
  testMail: string;

  @IsFQDN()
  baseUrl: string;
}

export const environment = new Environment();
async function parse(){
  load();
  environment.jobCount = +process.env.JOB_COUNT;
  environment.testMail = process.env.TEST_MAIL;
  environment.baseUrl = process.env.BASE_URL;

  try {
    await validateOrReject(environment);
  } catch (e) {
    console.log('Caught promise rejection (validation failed). Errors: ', errors);
  }
}

```

At this article you see how to use `dotenv-guards` library and how it solves our issues in project with dotenv usage and parsing.

I hope you enjoy this article, share it with your friends and colleagues.

### Last words

In future releases I'll rewrite `dotenv-guards` built-in guards with using `define` function.

|[Previous](03-jsx-temegram.md)  | [Main](README.md)  | Next |
|---------|---------|---------|
