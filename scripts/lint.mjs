import { globby, path } from 'zx';

const markdownlint = require('markdownlint');

const files = await globby(['blog/**/*.md', 'README.md' , '!**/node_modules/**'], {
  cwd: process.cwd(),
  gitignore: true,
});

const config = markdownlint.readConfigSync(path.join(__dirname, '..', '.markdownlintrc'));

const result = markdownlint.sync({
  config,
  files,
  customRules: [
    {
      description: 'Invalid reference link',
      function: (params, onError) => {
        /**
         * markdown-lint automatically transforms founded reference links when
         * passing the tokens and removing the markdown code. E.g.:
         * * `[something][somewhere]` → Is a child of type `text` with content
         *   set to `something`
         *
         * If the reference is not found it will return the following:
         * `[something][somewhere]` → Is a child of type `text` with content
         *   set to `[something][somewhere]`
         *
         * To know if a reference is found or not, we search all the children
         * of type `text` and we check if their content matches the RegExp.
         * If it is we know the reference is invalid.
         *
         */

        /**
         * This matches the ending part of a reference link. E.g:  `][somewhere]`
         * Taking into account new lines, etc.
         */
        const refLinkRegExp = /\](\[(.|\s)*?\])/gi;

        params.tokens.filter((token) => {
          return token.type === 'inline';
        }).forEach((token) => {
          return token.children.filter((child) => {
            return child.type === 'text';
          }).forEach((text) => {
            const invalidRefLink = refLinkRegExp.exec(text.content);

            if (invalidRefLink !== null) {
              onError({
                // context: invalidRefLink[1],
                detail: `Reference: ${invalidRefLink[1]}`,
                lineNumber: text.lineNumber
              });
            }
          });
        });
      },
      names: ['valid-reference-links'],
      tags: ['links']
    }
  ]
});

const resultString = result.toString();
const returnCode = resultString ? 1 : 0;

if (resultString) {
  console.error(resultString);
} else {
  console.log('All good! ✨');
}

process.exit(returnCode); // eslint-disable-line
