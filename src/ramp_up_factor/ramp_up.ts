import {readFile} from 'fs/promises';
import {getFiles} from '../api_server/get_files';
import {AggregateFilePromise} from '../aggregate_request';

async function get_ratio(repoName: string): Promise<number> {
  // Get a list of all files in the repository
  let totalComments = 0;
  let totalSLOC = 0;

  // Iterate over the list of files
  for await (const file of getFiles(repoName)) {
    if (file.endsWith('.js') || file.endsWith('.ts')) {
      const fileContent = await readFile(file, 'utf-8');
      const commentRegex =
        /(?<single>[\s]*?\/\/[\s\S]*?\n)|(?<multi>\/\*[\s\S]*?\*\/)/gm;
      const commentMatches = fileContent.matchAll(commentRegex) || [];
      let curr_single_count = 0;
      let curr_multi_count = 0;
      for (const commentMatch of commentMatches) {
        if (commentMatch.groups !== undefined) {
          if (commentMatch.groups.single !== undefined) {
            curr_single_count++;
          }
          if (commentMatch.groups.multi !== undefined) {
            curr_multi_count += commentMatch.groups.multi
              .split('\n')
              .filter(line => line.trim() !== '').length;
          }
        }
      }
      totalComments += curr_multi_count + curr_single_count;

      //totalComments += commentMatches.length;
      totalSLOC += fileContent
        .split('\n')
        .filter(line => line.trim() !== '').length;
    }
  }
  return totalComments / totalSLOC;
}

export function compute_ramp_up_score(ratio_lines: number): number {
  let commentScore = 0;
  if (ratio_lines > 0.15) {
    commentScore = 1;
  } else if (ratio_lines > 0.12) {
    commentScore = 0.8;
  } else if (ratio_lines > 0.09) {
    commentScore = 0.6;
  } else if (ratio_lines > 0.06) {
    commentScore = 0.4;
  } else if (ratio_lines > 0.03) {
    commentScore = 0.2;
  } else {
    commentScore = 0;
  }
  return commentScore;
}

export async function get_ramp_up_score(
  url: string,
  aggregate_file: AggregateFilePromise
): Promise<number> {
  try {
    const local_repo_path = await aggregate_file.git_repo_path;
    const ratio_lines: number = await get_ratio(local_repo_path);
    return compute_ramp_up_score(ratio_lines);
  } catch (err) {
    globalThis.logger?.error(`RampUp Score calc got error for ${url}: ${err}`);
  }
  return 0;
}
