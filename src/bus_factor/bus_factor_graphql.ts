import {request} from 'https';

interface TOTAL_COUNT {
  totalCount: number;
}

interface REPOSITORY_INTERNAL {
  id: string;
  forks: TOTAL_COUNT;
}

interface REPOSITORY {
  repository: REPOSITORY_INTERNAL;
}

interface RESPONSE {
  data: REPOSITORY;
}

export async function get_number_forks(
  github_repo_url: string
): Promise<number | undefined> {
  const reg = new RegExp('github\\.com/([A-Za-z0-9_]*-*)+/([A-Za-z0-9_]*-*)+');
  const matches = github_repo_url.match(reg);
  if (matches === null) {
    return;
  }
  //https://stepzen.com/blog/consume-graphql-in-javascript
  // code using https request example
  const data = JSON.stringify({
    query: `{
      repository(name: "${matches[2]}", owner: "${matches[1]}") {
        id
        forks {
          totalCount
        }
      }
    }
    `,
  });
  console.log(JSON.parse(data));
  const options = {
    hostname: 'api.github.com',
    path: '/graphql',
    port: 443,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      Authorization: 'bearer ' + process.env.GITHUB_TOKEN,
      'User-Agent': 'Node',
    },
  };
  const do_request = (options: Object, data: string): Promise<RESPONSE> => {
    return new Promise((resolve, reject) => {
      const req = request(options, res => {
        res.setEncoding('utf8');
        let data = '';
        console.log(`statusCode: ${res.statusCode}`);
        res.on('data', d => {
          data += d;
        });
        res.on('end', () => {
          resolve(JSON.parse(data));
        });
      });
      req.on('error', error => {
        reject(error);
      });
      req.write(data);
      req.end();
    });
  };
  try {
    const return_value: RESPONSE = await do_request(options, data);
    console.log(JSON.stringify(return_value, null, 2));
    return return_value.data.repository.forks.totalCount;
  } catch (err) {
    console.log(err);
  }
  return undefined;
}

(async () => {
  console.log(await get_number_forks('https://github.com/torvalds/linux'));
})();
