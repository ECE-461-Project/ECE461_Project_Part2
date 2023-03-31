import * as dotenv from 'dotenv';
import {resolve} from 'path';
import {Sequelize, DataTypes, Model} from 'sequelize';

function create_sequelize() {
  dotenv.config({
    path: resolve(process.cwd(), '.env.mariadb'),
  });
  if (!process.env.DB_HOST) {
    throw new Error('DB_HOST not defined');
  }
  if (!process.env.DB_USER) {
    throw new Error('DB_USER not defined');
  }
  if (!process.env.DB_PASSWORD) {
    throw new Error('DB_PASSWORD not defined');
  }
  //https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-constructor-constructor
  const sequelize = new Sequelize(
    'custom_repository',
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'mariadb',
      pool: {
        max: 5,
        min: 0,
        acquire: 20000,
        idle: 10000,
      },
      //logging: (...msg: any) => console.log(msg),
      define: {
        freezeTableName: true,
      },
    }
  );
  return sequelize;
}

export const sequelize = create_sequelize();
export class usergroups extends Model {
  declare GroupID: number;
  declare GroupName: string;
}
usergroups.init(
  {
    GroupID: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    GroupName: {
      type: DataTypes.TEXT('tiny'),
      allowNull: false,
      unique: true,
    },
  },
  {sequelize}
);
export class users extends Model {
  declare UserID: number;
  declare Username: string;
  declare UserPassword: string;
  declare Permissions: string;
  declare UserGroups: string;
}
users.init(
  {
    UserID: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    Username: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    UserPassword: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    Permissions: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    UserGroups: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {sequelize}
);
export class packages extends Model {
  declare PackageID: number;
  declare PackageName: string;
  declare PackagePath: string;
  declare GitHubLink: string;
  declare RatedAndApproved: number;
  declare VersionNumber: string;
  declare NetScore: number;
  declare BusFactor: number;
  declare Correctness: number;
  declare RampUp: number;
  declare ResponsiveMaintainer: number;
  declare LicenseScore: number;
  declare GoodPinningPractice: number;
  declare GoodEngineeringProcess: number;
  declare UploadDate: Date;
  declare FK_UserID: number;
}
packages.init(
  {
    PackageID: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    PackageName: {
      type: DataTypes.TEXT('tiny'),
      allowNull: false,
    },
    PackagePath: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    GitHubLink: {
      type: DataTypes.TEXT,
    },
    RatedAndApproved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    VersionNumber: {
      type: DataTypes.TEXT('tiny'),
      allowNull: false,
    },
    NetScore: {
      type: DataTypes.FLOAT.UNSIGNED,
      defaultValue: 0,
    },
    BusFactor: {
      type: DataTypes.FLOAT.UNSIGNED,
      defaultValue: 0,
    },
    Correctness: {
      type: DataTypes.FLOAT.UNSIGNED,
      defaultValue: 0,
    },
    RampUp: {
      type: DataTypes.FLOAT.UNSIGNED,
      defaultValue: 0,
    },
    ResponsiveMaintainer: {
      type: DataTypes.FLOAT.UNSIGNED,
      defaultValue: 0,
    },
    LicenseScore: {
      type: DataTypes.FLOAT.UNSIGNED,
      defaultValue: 0,
    },
    GoodPinningPractice: {
      type: DataTypes.FLOAT.UNSIGNED,
      defaultValue: 0,
    },
    GoodEngineeringProcess: {
      type: DataTypes.FLOAT.UNSIGNED,
      defaultValue: 0,
    },
    UploadDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    FK_UserID: {
      type: DataTypes.INTEGER.UNSIGNED,
      references: {
        model: users,
        key: 'UserID',
      },
    },
  },
  {sequelize}
);

sequelize
  .sync({alter: true})
  .then(() => {
    console.log('INITIAL Database tables have been synced');
  })
  .catch(() => {
    console.log('INITIAL Database table sync failed');
  });
