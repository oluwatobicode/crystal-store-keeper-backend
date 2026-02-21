export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Invalid email or password",
  UNAUTHORIZED: "You are not authorized to perform this action",
  NOT_FOUND: "Resource not found",
  VALIDATION_ERROR: "Validation error",
  SERVER_ERROR: "Internal server error",
  DUPLICATE_ENTRY: "Resource already exists",
  REQUIRED_FIELD: (field: string) => `${field} is required`,
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  SIGNUP_SUCCESS: "Signup successful",
  UPDATE_SUCCESS: "Update successful",
  DELETE_SUCCESS: "Delete successful",
  CREATE_SUCCESS: "Create successful",
  FETCH_SUCCESS: "Fetched successfully",
};

export const PRODUCT_MESSAGES = {
  CREATED: "Product created successfully",
  UPDATED: "Product updated successfully",
  DELETED: "Product deleted successfully",
  FETCHED: "Products fetched successfully",
  FETCHED_ONE: "Product fetched successfully",
  NOT_FOUND: "Product not found",
  DUPLICATE_SKU: "A product with this SKU already exists",
  MISSING_FIELDS:
    "Name, unit, SKU, purchase cost, and selling price are required",
};

export const SUPPLIER_MESSAGES = {
  CREATED: "Supplier created successfully",
  UPDATED: "Supplier updated successfully",
  DELETED: "Supplier deleted successfully",
  FETCHED: "Suppliers fetched successfully",
  FETCHED_ONE: "Supplier fetched successfully",
  NOT_FOUND: "Supplier not found",
  MISSING_FIELDS: "Name, contact person, phone, and email are required",
};

export const CUSTOMER_MESSAGES = {
  CREATED: "Customer created successfully",
  UPDATED: "Customer updated successfully",
  DELETED: "Customer deleted successfully",
  FETCHED: "Customers fetched successfully",
  FETCHED_ONE: "Customer fetched successfully",
  NOT_FOUND: "Customer not found",
  MISSING_FIELDS: "Full name, phone, and customer type are required",
  DUPLICATE_PHONE: "A customer with this phone number already exists",
};

export const USER_MESSAGES = {
  CREATED: "User created successfully",
  UPDATED: "User updated successfully",
  DELETED: "User deleted successfully",
  FETCHED: "Users fetched successfully",
  FETCHED_ONE: "User fetched successfully",
  NOT_FOUND: "User not found",
  MISSING_FIELDS:
    "Full name, username, password, role, and contact number are required",
  DUPLICATE_USERNAME: "A user with this username already exists",
};

export const ROLE_MESSAGES = {
  CREATED: "Role created successfully",
  UPDATED: "Role updated successfully",
  DELETED: "Role deleted successfully",
  FETCHED: "Roles fetched successfully",
  FETCHED_ONE: "Role fetched successfully",
  NOT_FOUND: "Role not found",
  MISSING_FIELDS: "Role name and description are required",
  DUPLICATE_NAME: "A role with this name already exists",
  CANNOT_DELETE_DEFAULT: "Default roles cannot be deleted",
  CANNOT_MODIFY_DEFAULT: "Default role name cannot be changed",
  INVALID_PERMISSIONS: "One or more permissions are invalid",
};
export const API_VERSION = "v1";

// Time constants (in seconds)
export const TIME = {
  ONE_HOUR: 60 * 60,
  ONE_DAY: 60 * 60 * 24,
  ONE_WEEK: 60 * 60 * 24 * 7,
};

// Session configuration
export const SESSION = {
  EXPIRES_IN: TIME.ONE_WEEK, // 7 days
  UPDATE_AGE: TIME.ONE_DAY, // 1 day
};

// Upload configuration
export const UPLOAD = {
  MAX_PDF_SIZE: 60 * 1024 * 1024, // 60MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_PDF_TYPES: ["application/pdf"],
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
};
