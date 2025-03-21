import mongoose from 'mongoose';

/**
 * Middleware for handling soft delete in mongoose schemas
 * @param schema Mongoose schema to apply soft delete middleware to
 */
export const applyDeletedFilter = (schema: mongoose.Schema): void => {
  schema.pre(['find', 'findOne'], function (next) {
    if (!Object.prototype.hasOwnProperty.call(this.getQuery(), 'isDeleted')) {
      this?.where({ isDeleted: false });
    }
    next();
  });
};
