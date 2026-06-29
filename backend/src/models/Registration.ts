import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface RegistrationAttributes {
  id: number;
  uuid: string;
  eventId: number;
  emailAddress: string;
  registrationNo: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RegistrationCreationAttributes
  extends Optional<RegistrationAttributes, 'id' | 'uuid'> {}

class Registration
  extends Model<RegistrationAttributes, RegistrationCreationAttributes>
  implements RegistrationAttributes
{
  public id!: number;
  public uuid!: string;
  public eventId!: number;
  public emailAddress!: string;
  public registrationNo!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Registration.init(
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
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    emailAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    registrationNo: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'registrations',
    timestamps: true,
  }
);

export default Registration;
