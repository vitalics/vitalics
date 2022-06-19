---
title: 'Using dotenv guards for environment variables management'
description: 'At this article I'll share about dotenv-guards library and how it solves our issues in current project'
author: @vitalics
tags: ['Node.js', 'dotenv', 'dotenv-guards', 'typescript']
date: '19 June 2022'
edited: '19 June 2022'
---

## Table of contents

- Context
- Before
- After
- Conclusion

## Context

My projects are very huge and complex, we're working on automotive industry and our mission - make users happy with minimal involving. The user should fullfil financial info and upload driver license - and then he can purchase any car, matched by his financial capabilities. As I mentioned before - this is huge project with a lot of involving teams. On this project my role - lead and drive core changes of automation framework.

On this project We're facing with a problem, which is that we have a lot of environment variables, which should be parsed by rules, e.g. `jobsCount`, `browser` etc. . We need to manage them in a way, which is easy to use and easy to change.

Let's see how it was before the library usage.

## Before

We use `dotenv` to parse and load environment variables to `process.env` object. We also have a `env` utility to load env variables.

Where it was located:

```txt
`package.json
`src
  `utils
    `index.ts
    `env
       `register.ts - this file is responsible for loading and parse env variables
       `index.ts - exported variables are used in `register.ts`
...

```

Let's deep dive into `index.ts` file:

``` ts
// utils/env/index.ts
export let RETRY_COUNT = process.env.RETRY_COUNT;
export let BROWSER = 'chrome';
... // other variables
```

But this variables are predefined and if engineer set them with wrong values - we get an unexpected error.

```typescript
// utils/env/register.ts
export default function register(){
  // load env variable
  RETRY_COUNT = +process.env.RETRY_COUNT;
}
```

The problem here with parsing is that we have a lot of variables with various requirements, e.g. numeric value, should be Finite and valid number, string always should be a subset of enum, etc.

## After

I would like to present you with a simple example of how to use `dotenv-guards` library.

getting started:
`npm install dotenv-guards`

using in our project:

``` ts
// utils/env/register.ts
import {config} from 'dotenv';
import {numberGuard} from 'dotenv-guards';

export default function register(){
  // load env variable
    config();
    // required variable, throws an error if `process.env.RETRY_COUNT` is not defined
    RETRY_COUNT = numberGuard(process.env.RETRY_COUNT, 0, {throwOnFinite: true, throwOnUndefined: true});
}
```

## Conclusion

At this article you see how to use `dotenv-guards` library and how it solves our issues in project with dotenv usage and parsing.

I hope you enjoy this article, share it with your friends and colleagues.

|[Previous](02-github-automation.md)  | [Main](README.md)  | Next  |
|---------|---------|---------|
