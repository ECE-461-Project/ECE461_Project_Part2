import {get_github_url} from 'url_parser';

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
    for (i = 0; i < 30; i++) {
      if (commitsData[i] === undefined) {
        break;
      }
      const last_commit_date = new Date(commitsData[i].commit.author.date);
      const today = Date.now();
      const diff = Math.abs(
        Math.round((today - last_commit_date.getTime()) / (1000 * 60 * 60 * 24))
      );
      sum = sum + diff;
    }
    const average = sum / (i - 1);
    if (average === 0) {
      return 1;
    } else {
      const score = 21 / average;
      if (score > 1) {
        return 1;
      } else {
        return score;
      }
    }
  } catch (err) {
    globalThis.logger.error('Error in get_percent_owner ' + err);
  }
  return 0;
}
