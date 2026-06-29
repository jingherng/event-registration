import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface EmployeeAttributes {
  id: number;
  uuid: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmployeeCreationAttributes
  extends Optional<EmployeeAttributes, 'id' | 'uuid'> {}

class Employee
  extends Model<EmployeeAttributes, EmployeeCreationAttributes>
  implements EmployeeAttributes
{
  public id!: number;
  public uuid!: string;
  public name!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Employee.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'employees',
    timestamps: true,
  }
);

export default Employee;
