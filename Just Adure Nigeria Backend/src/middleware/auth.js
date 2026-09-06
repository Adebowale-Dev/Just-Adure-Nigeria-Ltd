import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import { User } from "../models/user.js";
import { signToken, verifyToken } from "../utils/token.js";

export const rolePermissionMap = {
  super_admin: ["*"],
  admin: ["*"],
  inventory_manager: ["dashboard:view", "reports:view", "products:read", "inventory:manage"],
  order_manager: ["dashboard:view", "reports:view", "orders:read", "orders:update", "returns:manage"],
  customer_support: ["dashboard:view", "orders:read", "support:manage", "returns:manage", "reviews:moderate"],
  content_manager: ["dashboard:view", "products:read", "products:manage", "coupons:manage", "reviews:moderate"],
};

export const authCookieNames = {
  access: "ja_access_token",
  refresh: "ja_refresh_token",
};

function userHasPermission(user, permission) {
  if (!user) return false;
  if (user.permissions?.includes("*") || user.permissions?.includes(permission)) return true;
  return user.roles?.some((role) => rolePermissionMap[role]?.includes("*") || rolePermissionMap[role]?.includes(permission));
}

function authCookieOptions(maxAgeMs) {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: maxAgeMs,
    path: "/",
  };
}

function issueAccessCookie(response, user) {
  const accessToken = signToken({ sub: String(user._id), type: "access", roles: user.roles }, env.JWT_ACCESS_SECRET, env.ACCESS_TOKEN_TTL_MINUTES * 60);
  response.cookie(authCookieNames.access, accessToken, authCookieOptions(env.ACCESS_TOKEN_TTL_MINUTES * 60 * 1000));
}

export async function getAuthenticatedUser(request, response) {
  const accessToken = request.cookies?.[authCookieNames.access];
  if (accessToken) {
    try {
      const payload = verifyToken(accessToken, env.JWT_ACCESS_SECRET, "access");
      const user = await User.findById(payload.sub).select("roles permissions isActive");
      if (user?.isActive) return user;
    } catch {
      // Access tokens are short-lived. Fall back to refresh token below.
    }
  }

  const refreshToken = request.cookies?.[authCookieNames.refresh];
  if (!refreshToken) return null;

  try {
    const payload = verifyToken(refreshToken, env.JWT_REFRESH_SECRET, "refresh");
    const user = await User.findById(payload.sub).select("roles permissions isActive");
    if (!user?.isActive) return null;
    issueAccessCookie(response, user);
    return user;
  } catch {
    response.clearCookie(authCookieNames.access, { path: "/" });
    response.clearCookie(authCookieNames.refresh, { path: "/" });
    return null;
  }
}

export const optionalAuth = async (request, response, next) => {
  try {
    const user = await getAuthenticatedUser(request, response);
    if (user) {
      request.user = {
        id: String(user._id),
        roles: user.roles,
        permissions: user.permissions,
      };
    }
    next();
  } catch {
    next();
  }
};
export const requireAuth = async (request, response, next) => {
  try {
    const user = await getAuthenticatedUser(request, response);
    if (!user) {
      throw new AppError(401, "AUTH_REQUIRED", "Please log in to continue.");
    }

    request.user = {
      id: String(user._id),
      roles: user.roles,
      permissions: user.permissions,
    };
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError(401, "INVALID_AUTH_TOKEN", "Your session is invalid or has expired."));
  }
};

export function requireRoles(...allowedRoles) {
  return (request, _response, next) => {
    if (!request.user) {
      next(new AppError(401, "AUTH_REQUIRED", "Please log in to continue."));
      return;
    }
    const hasRole = request.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      next(new AppError(403, "INSUFFICIENT_PERMISSION", "You do not have permission to access this resource."));
      return;
    }
    next();
  };
}

export function requirePermissions(...requiredPermissions) {
  return (request, _response, next) => {
    if (!request.user) {
      next(new AppError(401, "AUTH_REQUIRED", "Please log in to continue."));
      return;
    }
    const allowed = requiredPermissions.some((permission) => userHasPermission(request.user, permission));
    if (!allowed) {
      next(new AppError(403, "INSUFFICIENT_PERMISSION", "You do not have permission to perform this action."));
      return;
    }
    next();
  };
}
