CREATE DATABASE IF NOT EXISTS custom_repository;
USE custom_repository;
CREATE TABLE IF NOT EXISTS usergroups (
  GroupID INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  GroupName TINYTEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS users (
  UserID INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  Username TEXT NOT NULL UNIQUE,
  UserPassword TEXT NOT NULL,
  Permissions JSON NOT NULL,
  UserGroups JSON NOT NULL
);
INSERT INTO users
SELECT NULL, 'deleted_user', 'password', '{}', '{}'
WHERE NOT EXISTS
  (SELECT Username
   FROM users
   WHERE Username = 'deleted_user');
CREATE TABLE IF NOT EXISTS packages (
  PackageID INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  PackageName TINYTEXT NOT NULL,
  PackagePath TEXT NOT NULL,
  GitHubLink TEXT,
  VersionNumber TINYTEXT NOT NULL,
  NetScore FLOAT UNSIGNED DEFAULT 0,
  BusFactorScore FLOAT UNSIGNED DEFAULT 0,
  CorrectnessScore FLOAT UNSIGNED DEFAULT 0,
  LicenseScore FLOAT UNSIGNED DEFAULT 0,
  RampUpScore FLOAT UNSIGNED DEFAULT 0,
  ResponsivenessScore FLOAT UNSIGNED DEFAULT 0,
  PinnedVersionScore FLOAT UNSIGNED DEFAULT 0,
  PullRequestScore FLOAT UNSIGNED DEFAULT 0,
  UploadDate DATETIME NOT NULL,
  FK_UserID INT UNSIGNED NOT NULL,
  FOREIGN KEY (FK_UserID) REFERENCES users (UserID),
  CHECK (NetScore<=1),
  CHECK (BusFactorScore<=1),
  CHECK (CorrectnessScore<=1),
  CHECK (LicenseScore<=1),
  CHECK (RampUpScore<=1),
  CHECK (ResponsivenessScore<=1),
  CHECK (PinnedVersionScore<=1),
  CHECK (PullRequestScore<=1)
);
