import { NextFunction, Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/response";
import { ERROR_MESSAGES, HTTP_STATUS, ROLE_MESSAGES } from "../config";
import Role from "../models/Role";
import { ALL_PERMISSIONS, Permission } from "../types/role.types";
import { logAudit } from "../utils/auditLog";

// this is to create a new role
export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { roleName, description, permissions } = req.body;

    if (!roleName || !description) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ROLE_MESSAGES.MISSING_FIELDS,
      );
    }

    const existingRole = await Role.findOne({ roleName });
    if (existingRole) {
      return sendError(res, HTTP_STATUS.CONFLICT, ROLE_MESSAGES.DUPLICATE_NAME);
    }

    // validate that all permissions are valid
    if (permissions && permissions.length > 0) {
      const invalidPermissions = permissions.filter(
        (p: string) => !ALL_PERMISSIONS.includes(p as Permission),
      );
      if (invalidPermissions.length > 0) {
        return sendError(
          res,
          HTTP_STATUS.BAD_REQUEST,
          ROLE_MESSAGES.INVALID_PERMISSIONS,
        );
      }
    }

    const newRole = await Role.create(req.body);

    await logAudit(
      null,
      "System",
      "CREATE_ROLE",
      `Created role: ${newRole.roleName}`,
      "users",
    );

    return sendSuccess(
      res,
      HTTP_STATUS.CREATED,
      ROLE_MESSAGES.CREATED,
      newRole,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Create role error:", error);
    return next(error);
  }
};

// this is to get all roles
export const getAllRoles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const roles = await Role.find();

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      roles.length > 0 ? ROLE_MESSAGES.FETCHED : "No roles found",
      roles,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get all roles error:", error);
    return next(error);
  }
};

// this is to get a single role
export const getRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, ROLE_MESSAGES.NOT_FOUND);
    }

    return sendSuccess(res, HTTP_STATUS.OK, ROLE_MESSAGES.FETCHED_ONE, role);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get role error:", error);
    return next(error);
  }
};

// this is to update a role
export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, ROLE_MESSAGES.NOT_FOUND);
    }

    // prevent renaming default roles (Admin, Manager, Cashier)
    if (
      role.isDefault &&
      req.body.roleName &&
      req.body.roleName !== role.roleName
    ) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ROLE_MESSAGES.CANNOT_MODIFY_DEFAULT,
      );
    }

    // if roleName is being changed, check for duplicates
    if (req.body.roleName && req.body.roleName !== role.roleName) {
      const duplicateName = await Role.findOne({ roleName: req.body.roleName });
      if (duplicateName) {
        return sendError(
          res,
          HTTP_STATUS.CONFLICT,
          ROLE_MESSAGES.DUPLICATE_NAME,
        );
      }
    }

    // validate permissions if provided
    if (req.body.permissions && req.body.permissions.length > 0) {
      const invalidPermissions = req.body.permissions.filter(
        (p: string) => !ALL_PERMISSIONS.includes(p as Permission),
      );
      if (invalidPermissions.length > 0) {
        return sendError(
          res,
          HTTP_STATUS.BAD_REQUEST,
          ROLE_MESSAGES.INVALID_PERMISSIONS,
        );
      }
    }

    const updatedRole = await Role.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    await logAudit(
      null,
      "System",
      "UPDATE_ROLE",
      `Updated role: ${updatedRole?.roleName}`,
      "users",
    );

    return sendSuccess(res, HTTP_STATUS.OK, ROLE_MESSAGES.UPDATED, updatedRole);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Update role error:", error);
    return next(error);
  }
};

// this is to update a role's permissions only
export const updateRolePermissions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, ROLE_MESSAGES.NOT_FOUND);
    }

    const { permissions } = req.body;

    if (!permissions || !Array.isArray(permissions)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ROLE_MESSAGES.INVALID_PERMISSIONS,
      );
    }

    // validate all permissions
    const invalidPermissions = permissions.filter(
      (p: string) => !ALL_PERMISSIONS.includes(p as Permission),
    );
    if (invalidPermissions.length > 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ROLE_MESSAGES.INVALID_PERMISSIONS,
      );
    }

    const updatedRole = await Role.findByIdAndUpdate(
      req.params.id,
      { permissions },
      { new: true, runValidators: true },
    );

    await logAudit(
      null,
      "System",
      "UPDATE_ROLE_PERMISSIONS",
      `Updated permissions for role: ${updatedRole?.roleName}`,
      "users",
    );

    return sendSuccess(res, HTTP_STATUS.OK, ROLE_MESSAGES.UPDATED, updatedRole);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Update role permissions error:", error);
    return next(error);
  }
};

// this is to delete a role
export const deleteRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, ROLE_MESSAGES.NOT_FOUND);
    }

    // prevent deleting default roles (Admin, Manager, Cashier)
    if (role.isDefault) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ROLE_MESSAGES.CANNOT_DELETE_DEFAULT,
      );
    }

    await Role.findByIdAndDelete(req.params.id);

    await logAudit(
      null,
      "System",
      "DELETE_ROLE",
      `Deleted role: ${role.roleName}`,
      "users",
    );

    return sendSuccess(res, HTTP_STATUS.OK, ROLE_MESSAGES.DELETED);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Delete role error:", error);
    return next(error);
  }
};
