const axios = require('axios');

export async function get_percent_owner(
  github_repo_url: string
): Promise<number | undefined> {
  const reg = new RegExp('github\\.com/(.+)/(.+)');
  const matches = github_repo_url.match(reg);
  if (matches === null) {
    return undefined;
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
  const repoAdr: string =
    'https://api.github.com/repos/' + matches[1] + '/' + matches[2];
  const commitsAdr: string =
    'https://api.github.com/repos/' +
    matches[1] +
    '/' +
    matches[2] +
    '/commits';
  try {
    let repoData: any = 0;
    await axios.get(repoAdr, config).then((response: any) => {
      repoData = response.data;
    });

    let commitsData: any = 0;
    await axios.get(commitsAdr, config).then((response: any) => {
      commitsData = response.data;
    });
    //globalThis.logger.debug('get_number_contributors query: ' + repo.data);
    const owner = repoData.owner.id;
    let ownerCommits = 0;
    let otherCommits = 0;
    for (let i = 0; i < 30; i++) {
      if (commitsData[i] === undefined) {
        break;
      }
      if (commitsData[i].author.id === owner) {
        ownerCommits += 1;
      } else {
        otherCommits += 1;
      }
    }
    const percentOwner = ownerCommits / (ownerCommits + otherCommits);
    return percentOwner;
  } catch (err) {
    if (err instanceof Error) {
      globalThis.logger.error('Error in get_percent_owner ' + err.message);
    }
  }
  return undefined;
}
