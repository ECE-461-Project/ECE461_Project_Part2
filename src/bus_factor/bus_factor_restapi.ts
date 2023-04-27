import {parse_aggregate_promise} from '../aggregate_request';

export async function get_percent_owner(
  aggregate: any
): Promise<number | undefined> {
  const aggregate_data = await parse_aggregate_promise(aggregate);
  try {
    if (aggregate_data) {
      const owner = aggregate_data.repo_data.owner.id;
      const commitsData: any = aggregate_data.commits_list;
      let ownerCommits = 0;
      let otherCommits = 0;
      for (let i = 0; i < 30; i++) {
        if (commitsData[i] === undefined) {
          break;
        }
        if (commitsData[i].commit.author.id === owner) {
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
    }
  } catch (err) {
    globalThis.logger?.error(`Error in get_percent_owner: ${err}`);
  }
  return undefined;
}
