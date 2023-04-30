import {AggregateResponsePromise} from '../aggregate_request';

export async function get_percent_owner(
  url: string,
  aggregate_response: AggregateResponsePromise
): Promise<number | undefined> {
  try {
    const owner = (await aggregate_response.repo_data).data.owner.id;
    const commitsData = (await aggregate_response.commits_list).data;
    let ownerCommits = 0;
    let otherCommits = 0;
    for (let i = 0; i < 30; i++) {
      if (commitsData[i] === undefined) {
        break;
      }
      if (commitsData[i].author?.id === owner) {
        ownerCommits += 1;
      } else {
        otherCommits += 1;
      }
    }
    globalThis.logger?.debug(
      `bus_factor: get_percent_owner: ${ownerCommits} other: ${otherCommits}`
    );
    const percentOwner = ownerCommits / (ownerCommits + otherCommits);
    return percentOwner;
  } catch (err) {
    globalThis.logger?.error(`Error in get_percent_owner for ${url}: ${err}`);
  }
  return undefined;
}
