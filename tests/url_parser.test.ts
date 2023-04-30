import * as fs from 'fs';
import * as readline from 'readline';

import * as url_parser from '../src/url_parser';

describe('testing check_if_npm', () => {
  test('is npmjs', () => {
    expect(
      url_parser.check_if_npm(
        'https://www.npmjs.com/package/get-package-github-url'
      )
    ).toBe(true);
  });
  test('is not npmjs', () => {
    expect(
      url_parser.check_if_npm(
        'https://www.npmjs.com/packages/get-package-github-url'
      )
    ).toBe(false);
  });
  test('is npmjs even if params', () => {
    expect(
      url_parser.check_if_npm(
        'https://www.npmjs.com/package/get-package-github-url?random_param=hi'
      )
    ).toBe(true);
  });
});

describe('testing check_if_github', () => {
  test('is github', () => {
    expect(
      url_parser.check_if_github(
        'https://github.com/marcofugaro/get-package-github-url'
      )
    ).toBe(true);
  });
  test('is not github', () => {
    expect(
      url_parser.check_if_github(
        'https://github.co/marcofugaro/get-package-github-url'
      )
    ).toBe(false);
  });
});

describe('testing get_npm_package_name', () => {
  test('npm', () => {
    expect(
      url_parser.get_npm_package_name(
        'https://www.npmjs.com/package/get-package-github-url'
      )
    ).toBe('get-package-github-url');
  });
  test('npm even if params', () => {
    expect(
      url_parser.get_npm_package_name(
        'https://www.npmjs.com/package/get-package-github-url?random_param=hi'
      )
    ).toBe('get-package-github-url');
  });
  test('npm not valid', () => {
    expect(
      url_parser.get_npm_package_name(
        'https://www.npmijs.com/package/get-package-github-u@rl'
      )
    ).toBe('');
  });
});

describe('testing get_github_url', () => {
  test('should work', async () => {
    expect(await url_parser.get_github_url('get-package-github-url')).toBe(
      'https://github.com/marcofugaro/get-package-github-url'
    );
  });
  test('should not work', async () => {
    expect(await url_parser.get_github_url('get-pa-ckage-github-url')).toBe(
      null
    );
  });
});

describe('testing get_url_parse_from_input', () => {
  test('should work', async () => {
    const a: url_parser.GitHubUrl_Info = {
      original: 'https://github.com/marcofugaro/get-package-github-url',
      github_repo_url: 'https://github.com/marcofugaro/get-package-github-url',
      owner: 'marcofugaro',
      repo: 'get-package-github-url',
    };
    expect(await url_parser.get_url_parse_from_input('https://github.com/marcofugaro/get-package-github-url')).toStrictEqual(a);
  });
  test('should work npmjs', async () => {
    const a: url_parser.GitHubUrl_Info = {
      original: 'https://www.npmjs.com/package/get-package-github-url',
      github_repo_url: 'https://github.com/marcofugaro/get-package-github-url',
      owner: 'marcofugaro',
      repo: 'get-package-github-url',
    };
    expect(await url_parser.get_url_parse_from_input('https://www.npmjs.com/package/get-package-github-url')).toStrictEqual(a);
  });
  test('should not work', async () => {
    expect(await url_parser.get_url_parse_from_input('asdf')).toBe(undefined);
  });
})
