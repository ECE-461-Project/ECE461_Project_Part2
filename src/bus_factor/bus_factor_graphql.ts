import {parse_aggregate_promise} from '../aggregate_request';

export async function get_number_forks(
  aggregate: any
): Promise<number | undefined> {
  const aggregate_data = await parse_aggregate_promise(aggregate);
  if (aggregate_data) {
    return aggregate_data.correctness_data.repository.forks.totalCount;
  } else {
    return undefined;
  }
}
