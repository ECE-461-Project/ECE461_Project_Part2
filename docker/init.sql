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
  RatedAndApproved BIT DEFAULT 0,
  VersionNumber TINYTEXT NOT NULL,
  NetScore FLOAT UNSIGNED DEFAULT 0,
  BusFactor FLOAT UNSIGNED DEFAULT 0,
  Correctness FLOAT UNSIGNED DEFAULT 0,
  RampUp FLOAT UNSIGNED DEFAULT 0,
  ResponsiveMaintainer FLOAT UNSIGNED DEFAULT 0,
  LicenseScore FLOAT UNSIGNED DEFAULT 0,
  GoodPinningPractice FLOAT UNSIGNED DEFAULT 0,
  GoodEngineeringProcess FLOAT UNSIGNED DEFAULT 0,
  UploadDate DATETIME NOT NULL,
  FK_UserID INT UNSIGNED NOT NULL,
  FOREIGN KEY (FK_UserID) REFERENCES users (UserID),
  CHECK (NetScore<=1),
  CHECK (BusFactor<=1),
  CHECK (Correctness<=1),
  CHECK (RampUp<=1),
  CHECK (ResponsiveMaintainer<=1),
  CHECK (LicenseScore<=1),
  CHECK (GoodPinningPractice<=1),
  CHECK (GoodEngineeringProcess<=1)
);
