import {get_scores_from_url, SCORE_OUT} from '../score_calculations';
import {PackageID} from './models/models';
import {sequelize, packages} from './db_connector';

export async function package_rate_compute_and_update(
  id: PackageID,
  link_input: string,
  temp_dir: string
): Promise<SCORE_OUT> {
  // call metric computation
  const ud: SCORE_OUT = await get_scores_from_url(link_input, temp_dir);
  // write metrics values back into database
  await packages.update(
    {
      NetScore: ud.Rating.NetScore,
      BusFactor: ud.Rating.BusFactor,
      Correctness: ud.Rating.Correctness,
      RampUp: ud.Rating.RampUp,
      ResponsiveMaintainer: ud.Rating.ResponsiveMaintainer,
      LicenseScore: ud.Rating.LicenseScore,
      GoodPinningPractice: ud.Rating.GoodPinningPractice,
      PullRequest: ud.Rating.PullRequest,
    },
    {
      where: {
        PackageID: id,
      },
    }
  );
  return ud;
}

export async function package_rate_compute(
  link_input: string,
  temp_dir: string
): Promise<SCORE_OUT> {
  // call metric computation
  const ud: SCORE_OUT = await get_scores_from_url(link_input, temp_dir);
  return ud;
}

export function package_rate_ingestible(ud: SCORE_OUT): number {
  const ratings = ud.Rating;
  if (
    ratings.NetScore >= 0.5 &&
    ratings.BusFactor >= 0.5 &&
    ratings.Correctness >= 0.5 &&
    ratings.RampUp >= 0.5 &&
    ratings.ResponsiveMaintainer >= 0.5 &&
    ratings.LicenseScore >= 0.5 &&
    ratings.GoodPinningPractice >= 0.5 &&
    ratings.PullRequest >= 0.5
  ) {
    return 1;
  } else {
    // TODO: come back once ingestibility and rating works
    return 1;
  }
}

export async function package_rate_update(id: PackageID, ud: SCORE_OUT) {
  await packages.update(
    {
      GitHubLink: ud.GitHubLink,
      NetScore: ud.Rating.NetScore,
      BusFactor: ud.Rating.BusFactor,
      Correctness: ud.Rating.Correctness,
      RampUp: ud.Rating.RampUp,
      ResponsiveMaintainer: ud.Rating.ResponsiveMaintainer,
      LicenseScore: ud.Rating.LicenseScore,
      GoodPinningPractice: ud.Rating.GoodPinningPractice,
      PullRequest: ud.Rating.PullRequest,
    },
    {
      where: {
        PackageID: id,
      },
    }
  );
}

export async function package_rate_fetch(
  id: PackageID
): Promise<SCORE_OUT | undefined> {
  try {
    const result = await packages.findOne({where: {PackageID: id}});
    if (result) {
      const ud: SCORE_OUT = {
        URL: '',
        GitHubLink: '',
        Rating: {
          NetScore: result.NetScore,
          BusFactor: result.BusFactor,
          Correctness: result.Correctness,
          RampUp: result.RampUp,
          ResponsiveMaintainer: result.ResponsiveMaintainer,
          LicenseScore: result.LicenseScore,
          GoodPinningPractice: result.GoodPinningPractice,
          PullRequest: result.PullRequest,
        },
      };
      return ud;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
}
