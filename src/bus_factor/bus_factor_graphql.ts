import {AggregateResponsePromise} from '../aggregate_request';

export async function get_number_forks(
  url: string,
  aggregate_response: AggregateResponsePromise
): Promise<number | undefined> {
  try {
    const response: any = await aggregate_response.correctness_data;
    return response.repository.forks.totalCount;
  } catch (err) {
    if (err instanceof Error) {
      globalThis.logger?.error(
        `get_number_forks got error for repo: ${url}: ${err.message}`
      );
    } else {
      globalThis.logger?.error(`get_number_forks got error: ${url}: ${err}`);
    }
  }
  return undefined;
}
