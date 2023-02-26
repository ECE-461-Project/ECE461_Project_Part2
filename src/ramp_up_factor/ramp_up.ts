import {readdirSync, readFileSync, statSync} from 'fs';
import {join} from 'path';

// Modified from https://coderrocketfuel.com/article/recursively-list-all-the-files-in-a-directory-using-node-js
const getAllFiles = function (dirPath: string, arrayOfFiles: string[]) {
  const files = readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(file => {
    if (statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
    } else {
      if (file.endsWith('.js') || file.endsWith('.ts')) {
        arrayOfFiles.push(join(dirPath, '/', file));
      }
    }
  });
  return arrayOfFiles;
};

async function get_ratio(repoName: string): Promise<number> {
  return new Promise(resolve => {
    // Get a list of all files in the repository
    const array_of_files = getAllFiles(repoName, []);
    let totalComments = 0;
    let totalSLOC = 0;

    // Iterate over the list of files
    for (const file of array_of_files) {
      const fileContent = readFileSync(file, 'utf-8');
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
    resolve(totalComments / totalSLOC);
  });
}

export function compute_ramp_up_score(ratio_lines: number): number {
  let commentScore = 0;
  if (ratio_lines > 0.25) {
    commentScore = 1;
  } else if (ratio_lines > 0.2) {
    commentScore = 0.8;
  } else if (ratio_lines > 0.15) {
    commentScore = 0.6;
  } else if (ratio_lines > 0.1) {
    commentScore = 0.4;
  } else if (ratio_lines > 0.05) {
    commentScore = 0.2;
  } else {
    commentScore = 0;
  }
  return commentScore;
}

export async function get_ramp_up_score(
  local_repo_path: string
): Promise<number> {
  try {
    const ratio_lines: number = await get_ratio(local_repo_path);
    return compute_ramp_up_score(ratio_lines);
  } catch (err) {
    globalThis.logger?.error(`RampUp Score calc got error: ${err}`);
  }
  return 0;
}
