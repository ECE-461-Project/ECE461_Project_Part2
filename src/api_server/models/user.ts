import { DataTypes, Model, Sequelize } from "sequelize";

class User extends Model {
  public id!: number;
  public username!: string;
  public password!: string;
  public permissions!: string;
  public userGroups!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

const initUserModel = (sequelize: Sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      permissions: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userGroups: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "users",
      sequelize,
    }
  );
};

export { User, initUserModel };
