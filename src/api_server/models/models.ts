/**
 *
 * @export
 * @interface ModelError
 */
export interface ModelError {
  /**
   *
   * @type {number}
   * @memberof ModelError
   */
  code: number;
  /**
   *
   * @type {string}
   * @memberof ModelError
   */
  message: string;
}
/**
 *
 * @export
 * @interface ModelPackage
 */
export interface ModelPackage {
  /**
   *
   * @type {PackageMetadata}
   * @memberof ModelPackage
   */
  metadata: PackageMetadata;
  /**
   *
   * @type {PackageData}
   * @memberof ModelPackage
   */
  data: PackageData;
}
/**
 * The \"Name\" and \"Version\" are used as a unique identifier pair when uploading a package.  The \"ID\" is used as an internal identifier for interacting with existing packages.
 * @export
 * @interface PackageMetadata
 */
export interface PackageMetadata {
  /**
   *
   * @type {PackageName}
   * @memberof PackageMetadata
   */
  Name: PackageName;
  /**
   * Package version
   * @type {string}
   * @memberof PackageMetadata
   */
  Version: string;
  /**
   *
   * @type {PackageID}
   * @memberof PackageMetadata
   */
  ID: PackageID;
}
/**
 * This is a \"union\" type. - On package upload, either Content or URL should be set. - On package update, exactly one field should be set. - On download, the Content field should be set.
 * @export
 * @interface PackageData
 */
export interface PackageData {
  /**
   * Package contents. This is the zip file uploaded by the user. (Encoded as text using a Base64 encoding).  This will be a zipped version of an npm package's GitHub repository, minus the \".git/\" directory.\" It will, for example, include the \"package.json\" file that can be used to retrieve the project homepage.  See https://docs.npmjs.com/cli/v7/configuring-npm/package-json#homepage.
   * @type {string}
   * @memberof PackageData
   */
  Content?: string;
  /**
   * Package URL (for use in public ingest).
   * @type {string}
   * @memberof PackageData
   */
  URL?: string;
  /**
   * A JavaScript program (for use with sensitive modules).
   * @type {string}
   * @memberof PackageData
   */
  JSProgram?: string;
}
/**
 *
 * @export
 * @interface User
 */
export interface User {
  /**
   *
   * @type {string}
   * @memberof User
   */
  name: string;
  /**
   * Is this user an admin?
   * @type {boolean}
   * @memberof User
   */
  isAdmin: boolean;
}
/**
 * Authentication info for a user
 * @export
 * @interface UserAuthenticationInfo
 */
export interface UserAuthenticationInfo {
  /**
   * Password for a user. Per the spec, this should be a \"strong\" password.
   * @type {string}
   * @memberof UserAuthenticationInfo
   */
  password: string;
}
/**
 *
 * @export
 */
export type PackageID = string;
/**
 * Package rating (cf. Project 1).  If the Project 1 that you inherited does not support one or more of the original properties, denote this with the value \"-1\".
 * @export
 * @interface PackageRating
 */
export interface PackageRating {
  /**
   *
   * @type {number}
   * @memberof PackageRating
   */
  BusFactor: number;
  /**
   *
   * @type {number}
   * @memberof PackageRating
   */
  Correctness: number;
  /**
   *
   * @type {number}
   * @memberof PackageRating
   */
  RampUp: number;
  /**
   *
   * @type {number}
   * @memberof PackageRating
   */
  ResponsiveMaintainer: number;
  /**
   *
   * @type {number}
   * @memberof PackageRating
   */
  LicenseScore: number;
  /**
   * The fraction of its dependencies that are pinned to at least a specific major+minor version, e.g. version 2.3.X of a package. (If there are zero dependencies, they should receive a 1.0 rating. If there are two dependencies, one pinned to this degree, then they should receive a Â½ = 0.5 rating).
   * @type {number}
   * @memberof PackageRating
   */
  GoodPinningPractice: number;
}
/**
 * One entry of the history of this package.
 * @export
 * @interface PackageHistoryEntry
 */
export interface PackageHistoryEntry {
  /**
   *
   * @type {User}
   * @memberof PackageHistoryEntry
   */
  User: User;
  /**
   * Date of activity.
   * @type {Date}
   * @memberof PackageHistoryEntry
   */
  Date: Date;
  /**
   *
   * @type {PackageMetadata}
   * @memberof PackageHistoryEntry
   */
  PackageMetadata: PackageMetadata;
  /**
   *
   * @type {string}
   * @memberof PackageHistoryEntry
   */
  Action: ActionEnum;
}

export enum ActionEnum {
  CREATE = <any>'CREATE',
  UPDATE = <any>'UPDATE',
  DOWNLOAD = <any>'DOWNLOAD',
  RATE = <any>'RATE',
}
/**
 * Name of a package.  - Names should only use typical \"keyboard\" characters. - The name \"*\" is reserved. See the `/packages` API for its meaning.
 * @export
 */
export type PackageName = string;
/**
 * The spec permits you to use any token format you like. You could, for example, look into JSON Web Tokens (\"JWT\", pronounced \"jots\"): https://jwt.io.
 * @export
 */
export type AuthenticationToken = string;
/**
 *
 * @export
 * @interface AuthenticationRequest
 */
export interface AuthenticationRequest {
  /**
   *
   * @type {User}
   * @memberof AuthenticationRequest
   */
  User: User;
  /**
   *
   * @type {UserAuthenticationInfo}
   * @memberof AuthenticationRequest
   */
  Secret: UserAuthenticationInfo;
}
/**
 *
 * @export
 */
export type SemverRange = string;
/**
 *
 * @export
 * @interface PackageQuery
 */
export interface PackageQuery {
  /**
   *
   * @type {SemverRange}
   * @memberof PackageQuery
   */
  Version?: SemverRange;
  /**
   *
   * @type {PackageName}
   * @memberof PackageQuery
   */
  Name: PackageName;
}
/**
 * Offset in pagination.
 * @export
 */
export type EnumerateOffset = string;
/**
 * A regular expression over package names and READMEs that is used for searching for a package.
 * @export
 */
export type PackageRegEx = string;
