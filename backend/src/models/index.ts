import Employee from './Employee';
import Event from './Event';
import Registration from './Registration';

// Associations
Employee.hasMany(Event, { foreignKey: 'handlerId', as: 'events' });
Event.belongsTo(Employee, { foreignKey: 'handlerId', as: 'handler' });

Event.hasMany(Registration, { foreignKey: 'eventId', as: 'registrations' });
Registration.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

export { Employee, Event, Registration };
