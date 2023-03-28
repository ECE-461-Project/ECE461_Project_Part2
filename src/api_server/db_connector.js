"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.packages = exports.users = exports.usergroups = exports.sequelize = void 0;
var dotenv = require("dotenv");
var path_1 = require("path");
var sequelize_1 = require("sequelize");
function create_sequelize() {
    dotenv.config({
        path: (0, path_1.resolve)(process.cwd(), '.env.mariadb')
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
    var sequelize = new sequelize_1.Sequelize('custom_repository', process.env.DB_USER, process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        dialect: 'mariadb',
        pool: {
            max: 5,
            min: 0,
            acquire: 20000,
            idle: 10000
        },
        //logging: (...msg: any) => console.log(msg),
        define: {
            freezeTableName: true
        }
    });
    return sequelize;
}
exports.sequelize = create_sequelize();
var usergroups = /** @class */ (function (_super) {
    __extends(usergroups, _super);
    function usergroups() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return usergroups;
}(sequelize_1.Model));
exports.usergroups = usergroups;
usergroups.init({
    GroupID: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    GroupName: {
        type: sequelize_1.DataTypes.TEXT('tiny'),
        allowNull: false,
        unique: true
    }
}, { sequelize: exports.sequelize });
var users = /** @class */ (function (_super) {
    __extends(users, _super);
    function users() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return users;
}(sequelize_1.Model));
exports.users = users;
users.init({
    UserID: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    Username: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        unique: true
    },
    UserPassword: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false
    },
    Permissions: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false
    },
    UserGroups: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false
    }
}, { sequelize: exports.sequelize });
var packages = /** @class */ (function (_super) {
    __extends(packages, _super);
    function packages() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return packages;
}(sequelize_1.Model));
exports.packages = packages;
packages.init({
    PackageID: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    PackageName: {
        type: sequelize_1.DataTypes.TEXT('tiny'),
        allowNull: false
    },
    PackagePath: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false
    },
    GitHubLink: {
        type: sequelize_1.DataTypes.TEXT
    },
    RatedAndApproved: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    VersionNumber: {
        type: sequelize_1.DataTypes.TEXT('tiny'),
        allowNull: false
    },
    NetScore: {
        type: sequelize_1.DataTypes.FLOAT.UNSIGNED,
        defaultValue: 0
    },
    BusFactor: {
        type: sequelize_1.DataTypes.FLOAT.UNSIGNED,
        defaultValue: 0
    },
    Correctness: {
        type: sequelize_1.DataTypes.FLOAT.UNSIGNED,
        defaultValue: 0
    },
    RampUp: {
        type: sequelize_1.DataTypes.FLOAT.UNSIGNED,
        defaultValue: 0
    },
    ResponsiveMaintainer: {
        type: sequelize_1.DataTypes.FLOAT.UNSIGNED,
        defaultValue: 0
    },
    LicenseScore: {
        type: sequelize_1.DataTypes.FLOAT.UNSIGNED,
        defaultValue: 0
    },
    GoodPinningPractice: {
        type: sequelize_1.DataTypes.FLOAT.UNSIGNED,
        defaultValue: 0
    },
    GoodEngineeringProcess: {
        type: sequelize_1.DataTypes.FLOAT.UNSIGNED,
        defaultValue: 0
    },
    UploadDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false
    },
    FK_UserID: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        references: {
            model: users,
            key: 'UserID'
        }
    }
}, { sequelize: exports.sequelize });
exports.sequelize
    .sync({ alter: true })
    .then(function () {
    console.log('INITIAL Database tables have been synced');
})["catch"](function () {
    console.log('INITIAL Database table sync failed');
});
