// تصدير جميع الخدمات
export { default as authService } from './authService';
export { default as userService } from './userService';
export { default as roleService } from './roleService';
export { default as permissionService } from './permissionService';
export { default as ticketService } from './ticketService';

// تصدير الأنواع
export type { LoginRequest, LoginResponse, ChangePasswordRequest } from './authService';
export type { 
  CreateUserRequest, 
  UpdateUserRequest, 
  GetUsersParams, 
  UserStats 
} from './userService';
export type { 
  CreateRoleRequest, 
  UpdateRoleRequest, 
  GetRolesParams 
} from './roleService';
export type {
  CreatePermissionRequest,
  UpdatePermissionRequest,
  GetPermissionsParams,
  PermissionsByResource,
  PermissionStats
} from './permissionService';
export type {
  TicketListParams,
  CreateTicketData,
  UpdateTicketData,
  MoveTicketData,
  TicketStats
} from './ticketService';
