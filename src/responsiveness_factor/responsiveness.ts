import {get_github_url} from '../url_parser';

const axios = require('axios');

export async function get_responsiveness_score(
  github_repo_url: string
): Promise<number> {
  const reg = new RegExp('github\\.com/(.+)/(.+)');
  const matches = github_repo_url.match(reg);
  if (matches === null) {
    return 0;
  }
  if (process.env.GITHUB_TOKEN === undefined) {
    throw new Error('GITHUB_TOKEN is not defined');
  }
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'bearer ' + process.env.GITHUB_TOKEN,
      'User-Agent': 'Node',
    },
  };
  const commitsAdr: string =
    'https://api.github.com/repos/' +
    matches[1] +
    '/' +
    matches[2] +
    '/commits';
  try {
    let commitsData: any = 0;
    await axios.get(commitsAdr, config).then((response: any) => {
      commitsData = response.data;
    });
    let sum = 0;
    let i = 0;
    const time_elapsed = Date.now();
    const today = new Date(time_elapsed);
    // modified from https://stackoverflow.com/questions/3224834/get-difference-between-2-dates-in-javascript
    const utc1 = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    for (i = 0; i < 30; i++) {
      if (commitsData[i] === undefined) {
        break;
      }
      const last_commit_date = new Date(commitsData[i].commit.author.date);
      const utc2 = Date.UTC(
        last_commit_date.getFullYear(),
        last_commit_date.getMonth(),
        last_commit_date.getDate()
      );
      const diff_in_days = Math.abs(
        Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24))
      );
      sum = sum + diff_in_days;
    }
    const average = sum / (i - 1);
    globalThis.logger?.debug(`Responsiveness: avg ${average}`);
    if (average <= 90) {
      globalThis.logger?.debug('Responsiveness score 1');
      return 1;
    } else if (average <= 180) {
      return 0.9;
    } else if (average <= 270) {
      return 0.8;
    } else if (average <= 360) {
      return 0.7;
    } else if (average <= 450) {
      return 0.6;
    } else if (average <= 540) {
      return 0.5;
    } else if (average <= 630) {
      return 0.5;
    } else if (average <= 720) {
      return 0.4;
    } else if (average <= 810) {
      return 0.3;
    } else if (average <= 900) {
      return 0.2;
    } else if (average <= 990) {
      return 0.1;
    } else {
      return 0;
    }
  } catch (err) {
    globalThis.logger?.error('Error in get_percent_owner ' + err);
  }
  return 0;
}
