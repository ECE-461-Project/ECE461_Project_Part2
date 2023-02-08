import * as fs from 'fs';
import * as readline from 'readline';

import * as url_parser from '../src/url_parser';
import {create_logger} from '../src/logging_setup';

create_logger();

describe('testing readfile', () => {
  test('invalid/nonexistent file', async () => {
    await expect(url_parser.read_file('asdf')).rejects.toThrow();
  });
  test('regular_file', async () => {
    expect(
      await url_parser.read_file('./tests/_urls/random.txt')
    ).toStrictEqual(['asdf', '']);
  });
});

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

describe('testing _get_urls', () => {
  test('should not work', async () => {
    expect(await url_parser._get_urls('asdf')).toBe(undefined);
  });
  test('should work', async () => {
    const val = await url_parser._get_urls('./tests/_urls/url_test1.txt');
    const final: url_parser.URL_PARSE[] = [];
    if (val) {
      for await (const url of val) {
        final.push(url);
      }
    }
    expect(final).toStrictEqual([
      {
        github_repo_url: 'https://github.com/jonschlinkert/get-repository-url',
        original_url: 'https://www.npmjs.com/package/get-repository-url',
      },
      {
        github_repo_url: 'https://github.com/vuongtaquoc/url-parser',
        original_url: 'https://www.npmjs.com/package/url_parser',
      },
      {
        github_repo_url: 'https://github.com/davglass/license-checker',
        original_url: 'https://github.com/davglass/license-checker',
      },
      {
        github_repo_url: '',
        original_url: 'not_a_url',
      },
      {
        github_repo_url: '',
        original_url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Groups_and_Backreferences',
      },
      {
        github_repo_url: 'https://github.com/joehewitt/ajax',
        original_url:
          'https://www.npmjs.com/package/ajax?activeTab=dependencies',
      },
      {
        github_repo_url: '',
        original_url: 'https://www.npmjs.com/packages/get-package-github-url',
      },
      {
        github_repo_url: '',
        original_url: 'https://github.co/marcofugaro/get-package-github-url',
      },
    ]);
  });
});
describe('testing get_urls', () => {
  test('should work get_urls', async () => {
    const val = await url_parser.get_urls('./tests/_urls/url_test1.txt');
    expect(val).toStrictEqual([
      {
        github_repo_url: 'https://github.com/jonschlinkert/get-repository-url',
        original_url: 'https://www.npmjs.com/package/get-repository-url',
      },
      {
        github_repo_url: 'https://github.com/vuongtaquoc/url-parser',
        original_url: 'https://www.npmjs.com/package/url_parser',
      },
      {
        github_repo_url: 'https://github.com/davglass/license-checker',
        original_url: 'https://github.com/davglass/license-checker',
      },
      {
        github_repo_url: '',
        original_url: 'not_a_url',
      },
      {
        github_repo_url: '',
        original_url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Groups_and_Backreferences',
      },
      {
        github_repo_url: 'https://github.com/joehewitt/ajax',
        original_url:
          'https://www.npmjs.com/package/ajax?activeTab=dependencies',
      },
      {
        github_repo_url: '',
        original_url: 'https://www.npmjs.com/packages/get-package-github-url',
      },
      {
        github_repo_url: '',
        original_url: 'https://github.co/marcofugaro/get-package-github-url',
      },
    ]);
  });
  test('should not work', async () => {
    expect(await url_parser.get_urls('asdf')).toStrictEqual([]);
  });
  test('should be empty work', async () => {
    expect(await url_parser.get_urls('./tests/_urls/empty.txt')).toStrictEqual(
      []
    );
  });
});
