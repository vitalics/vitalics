---
title: 'Creating fully-automated github repository with github actions'
description: 'At this article I'll show the steps for configure github actions for publishing and automating releases'
author: @vitalics
tags: ['github', 'git', 'github actions', 'devops', 'npm', 'node.js']
date: '18 June 2022'
edited: '19 June 2022'
---

## Table of contents

- [Idea](#idea).
- [Requirements](#requirements).
- [Getting started](#getting-started).
- [Write some code](#write-some-code).
- [Setup the CI](#setup-the-ci).
- [Conclusion](#conclusion).

## Idea

Let's start with the idea of this article. We're going to create a fully automated github repository and going to use github actions to automate the process of creating a new release and as well as publishing the new version of the project to npm.

## Requirements

- IDE (I prefer to use [Visual Studio Code](https://code.visualstudio.com/))
- [Node.js](https://nodejs.org/en/download/)
- github account and empty repo.

## Getting started

Let's start with the first step. We need to initialize your future repository.
`npm init -y`.

Your `package.json` will look like this:

```json
{
  "name": "a",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

The `package.json` file is the main file for your project. It's the file that contains all the information about your project.

Let's add some information to it. First of all, we need to add the `name` of your project. This is the name of your project which will be used in the `npm` package, so it's important to choose a name that is unique, in my case I use `dotenv-guards` which is a library that I use to manage my environment variables and transform it into my own types.

The next step is to add the `version` of your project. I use the `1.0.0` version.

> I also pick up [typescript](https://www.typescriptlang.org/) as my preprocessor.

## Write some code

So we have the basic structure of the project. Now we need to write some code.

In my case I create a simple function that returns the transformed boolean value.

```typescript
// src/boolean.ts
type Options = {};
export default function booleanGuard(value: string, options?: Options): boolean {
  // use options if needed
  return value === 'true';
}
```

> Don't forget to add the unit tests. In my case I use [Jest](https://jestjs.io/) to test the code.

The common approach to test the code is to use AAA(arrange, act, assert) pattern.

```typescript
// src/boolean.test.ts
import booleanGuard from './boolean';

test('should work', function(){
    // arrange
    const input = 'true';
    const output = true;
    // act
    const result = booleanGuard(input);
    // assert
    expect(result).toBe(output);
})
```

## Setup the CI

Before you start to push and define CI, you need to make sure that you have the following:

- scripts in package.json, like `build`, `test`.

- package.json exports your core modules, in my case package.json looks like this(see `exports` field):

``` json
{
  "name": "dotenv-guards",
  "version": "1.2.2",
  "private": false,
  "description": "guards functions for dotenv package",
  "main": "lib/index.js",
  "types": "lib/index.d.ts",
  "scripts": {
    "test": "pnpm jest",
    "build": "tsc -p tsconfig.json"
  },
  "engines": {
    "node": ">=14",
    "pnpm": ">=6"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/vitalics/dotenv-guards.git"
  },
  "homepage": "https://github.com/vitalics/dotenv-guards",
  "keywords": [
    "dotenv",
    "dotenv-guards",
    "utilities"
  ],
  "exports": {
    "./package.json": "./package.json",
    "./": "./lib/index.js",
    "/array": "./lib/array.js",
    "/boolean": "./lib/boolean.js",
    "/number": "./lib/number.js",
    "/enum": "./lib/enum.js"
  },
  "author": "vitali Haradkou <vitalicset@yandex.ru>",
  "license": "MIT",
  "dependencies": {
    "dotenv": "16.0.1"
  },
  "devDependencies": {
    "@tsconfig/node14": "1.0.1",
    "@types/jest": "28.1.1",
    "@types/node": "17.0.41",
    "jest": "28.1.1",
    "ts-jest": "28.0.4",
    "typescript": "4.7.3"
  }
}
```

- Create a `.github/workflows/main.yml` file with following content:

```yml
name: build and publish release to npm

on:
  workflow_dispatch:
    inputs: # choose which type of release you want to build publish
      release_type:
        type: choice
        options:
          - patch
          - minor
          - major
        description: "version type, can be 'patch', 'minor', 'major'"
        required: true
        default: patch
  push:
    branches:
      - main
    tags:
      - "*"

jobs:
  npm_release:
    name: "Build and publish to npm"
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [14]
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      - name: Setup pnpm
        uses: pnpm/action-setup@v2.2.2
        with:
          version: 7.1.7
          run_install: |
            - args: []
      - run: pnpm jest # tests
      - name: Automated Version ${{ github.event.inputs.release_type || 'patch' }}
        uses: "phips28/gh-action-bump-version@master" # add version
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          target-branch: "main"
          default: ${{ github.event.inputs.release_type || 'patch' }}
          commit-message: "CI: bumps version to {{version}}"
      - uses: fregante/release-with-changelog@v3 # create changelog and github release
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-template: "- {title} ← {hash}"
          template: |
            ### Changelog
            {commits}
            Full changelog: {range}
            finds me on npm: https://www.npmjs.com/package/dotenv-guards
            ### Installation:
            npm: `npm install dotenv-guards@latest`
            yarn: `yarn add dotenv-guards@latest`
            pnpm: `pnpm add dotenv-guards@latest`
            made with ❤ from Vitali Haradkou
      - uses: JS-DevTools/npm-publish@v1 # publish to npm
        with:
          token: ${{ secrets.npm_token }}
```

> Don't forget to add the `npm_token` to the `.github/workflows/main.yml` file. It is a secret that you need to provide it to publish to npm.

Let's run this workflow, you should get something like this:
![workflow](images/02-conclusion.png)

>You also can define separate `workflow` and run some check when PR is opened. In this case you need to create new workflow and update `on` strategy to `pr`, and don't forget to remove `push` strategy, and releasing to npm.

## Conclusion

![github release](images/02-github.png)

This article is a simple guide to create a fully automated github repository and automate the process of creating a new release and publishing the new version of the project to npm. I hope that you will find this article useful. I hope you will like this article. If you have any questions, please don't hesitate to contact me.

This is a real package and the name is [dotenv-guards](https://github.com/vitalics/dotenv-guards)

Enjoy, and bye 👋!
