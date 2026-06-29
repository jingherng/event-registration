import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface EventAttributes {
  id: number;
  uuid: string;
  name: string;
  dateTime: Date;
  address: string;
  postalCode: string;
  deadline: Date;
  capacity: number;
  handlerId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EventCreationAttributes
  extends Optional<EventAttributes, 'id' | 'uuid'> {}

class Event
  extends Model<EventAttributes, EventCreationAttributes>
  implements EventAttributes
{
  public id!: number;
  public uuid!: string;
  public name!: string;
  public dateTime!: Date;
  public address!: string;
  public postalCode!: string;
  public deadline!: Date;
  public capacity!: number;
  public handlerId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Event.init(
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
      unique: true,
    },
    dateTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    postalCode: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    handlerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'events',
    timestamps: true,
  }
);

export default Event;
