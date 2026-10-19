import { Schema, options, model, text, refs, code } from './model-utils.js';
import { ROLE_CODES } from './constants.js';

const roleSchema = new Schema({
  code: code(ROLE_CODES, { unique: true }),
  permissionIds: refs('Permission'),
}, options('roles'));

const permissionSchema = new Schema({ code: text(80, { unique: true }) }, options('permissions'));

export const Role = model('Role', roleSchema);
export const Permission = model('Permission', permissionSchema);
