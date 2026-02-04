# RS-7: Test Case Report

**Document ID:** RS-7  
**Document Title:** Test Case Report  
**Project:** CTRL ALT Elite – Task Board  
**Version:** 1.0  
**Date:** 02/03/2026  
**Authors:** CTRL ALT Elite Team  
**Reference:** RS-6 (Test Plan Report)

---

## Introduction

This document provides detailed test cases for the CTRL ALT Elite Task Board backend API. All test cases referenced in RS-6 are documented here with complete test specifications including preconditions, test steps, expected results, and test data.

**Total Test Cases:** 44

---

## Test Case Format

Each test case includes:
- **Test Case ID**: Unique identifier (TC-XXX)
- **Test Case Name**: Descriptive name
- **Module**: Component being tested
- **Priority**: High, Medium, or Low
- **Test Type**: Functional, Integration, Validation, Authorization, Error Handling
- **Preconditions**: Required setup before test execution
- **Test Steps**: Detailed steps to execute the test
- **Test Data**: Input data used in the test
- **Expected Result**: Expected outcome
- **Actual Result**: (To be filled during execution)
- **Status**: Pass/Fail/Blocked (To be filled during execution)
- **Remarks**: Additional notes

---

## Module 1: Health Check

### TC-001: Health Check Endpoint

**Test Case ID:** TC-001  
**Test Case Name:** Test Health Check Endpoint  
**Module:** System Health  
**Priority:** High  
**Test Type:** Functional  
**Reference:** RS-6, Section 3.1.5

**Preconditions:**
- Test environment is set up
- Database is accessible
- FastAPI application is running

**Test Steps:**
1. Send GET request to `/health` endpoint
2. Verify response status code
3. Verify response body structure
4. Verify database connectivity status

**Test Data:**
- Endpoint: `GET /health`
- No input data required

**Expected Result:**
- Response status code: 200 OK
- Response body contains `{"status": "ok", "db": "up"}`
- Both `status` and `db` fields are present and correct

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Basic system health verification

---

## Module 2: User Management

### TC-002: Create User with All Fields

**Test Case ID:** TC-002  
**Test Case Name:** Test Creating a New User with All Fields  
**Module:** User Management  
**Priority:** High  
**Test Type:** Functional  
**Reference:** RS-6, Section 3.1.1

**Preconditions:**
- Test database is initialized
- No existing user with same clerk_id

**Test Steps:**
1. Send POST request to `/api/users` with user data
2. Verify response status code
3. Verify response contains all user fields
4. Verify user ID is a valid UUID
5. Verify all provided data is correctly stored

**Test Data:**
```json
{
  "clerk_id": "user_123",
  "email": "test@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Expected Result:**
- Response status code: 200 OK
- Response contains: `id`, `clerk_id`, `email`, `first_name`, `last_name`
- `id` is a valid UUID
- All provided fields match input data

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Happy path for user creation

---

### TC-003: Create User with Minimal Fields

**Test Case ID:** TC-003  
**Test Case Name:** Test Creating a User with Only Required Fields  
**Module:** User Management  
**Priority:** High  
**Test Type:** Functional  
**Reference:** RS-6, Section 3.1.1

**Preconditions:**
- Test database is initialized
- No existing user with same clerk_id

**Test Steps:**
1. Send POST request to `/api/users` with only required fields
2. Verify response status code
3. Verify response contains user data
4. Verify optional fields are null

**Test Data:**
```json
{
  "clerk_id": "user_456",
  "email": "minimal@example.com"
}
```

**Expected Result:**
- Response status code: 200 OK
- Response contains: `id`, `clerk_id`, `email`
- `first_name` and `last_name` are null

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests optional field handling

---

### TC-004: Create User with Duplicate Clerk ID (Update Pattern)

**Test Case ID:** TC-004  
**Test Case Name:** Test Creating User with Duplicate Clerk ID (Update Pattern)  
**Module:** User Management  
**Priority:** High  
**Test Type:** Functional  
**Reference:** RS-6, Section 3.1.1

**Preconditions:**
- Test database is initialized
- User with clerk_id "user_789" exists

**Test Steps:**
1. Create user with clerk_id "user_789"
2. Create another user with same clerk_id but different data
3. Verify response status code
4. Verify same user ID is returned
5. Verify user data is updated

**Test Data:**
- First request:
```json
{
  "clerk_id": "user_789",
  "email": "original@example.com",
  "first_name": "Original",
  "last_name": "Name"
}
```
- Second request:
```json
{
  "clerk_id": "user_789",
  "email": "updated@example.com",
  "first_name": "Updated",
  "last_name": "Name"
}
```

**Expected Result:**
- Both requests return 200 OK
- Same user ID returned in both responses
- Second response contains updated data
- Email and first_name are updated

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests create/update pattern for users

---

### TC-005: Create User with Duplicate Email

**Test Case ID:** TC-005  
**Test Case Name:** Test Creating User with Duplicate Email  
**Module:** User Management  
**Priority:** High  
**Test Type:** Validation  
**Reference:** RS-6, Section 3.1.1

**Preconditions:**
- Test database is initialized
- User with email "duplicate@example.com" exists

**Test Steps:**
1. Create first user with email "duplicate@example.com"
2. Attempt to create second user with same email but different clerk_id
3. Verify response status code
4. Verify error message

**Test Data:**
- First user:
```json
{
  "clerk_id": "user_111",
  "email": "duplicate@example.com"
}
```
- Second user:
```json
{
  "clerk_id": "user_222",
  "email": "duplicate@example.com"
}
```

**Expected Result:**
- First request: 200 OK
- Second request: 400 Bad Request
- Error message indicates email already exists

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests email uniqueness constraint

---

### TC-006: Get User by Clerk ID

**Test Case ID:** TC-006  
**Test Case Name:** Test Getting a User by Clerk ID  
**Module:** User Management  
**Priority:** High  
**Test Type:** Functional  
**Reference:** RS-6, Section 3.1.1

**Preconditions:**
- Test database is initialized
- User with clerk_id "user_get" exists

**Test Steps:**
1. Create a user with known clerk_id
2. Send GET request to `/api/users/{clerk_id}`
3. Verify response status code
4. Verify response contains correct user data

**Test Data:**
- Create user:
```json
{
  "clerk_id": "user_get",
  "email": "get@example.com",
  "first_name": "Get",
  "last_name": "User"
}
```
- Get user: `GET /api/users/user_get`

**Expected Result:**
- Response status code: 200 OK
- Response contains user with matching clerk_id
- All user fields are present and correct

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests user retrieval functionality

---

### TC-007: Get User Not Found

**Test Case ID:** TC-007  
**Test Case Name:** Test Getting a User That Doesn't Exist  
**Module:** User Management  
**Priority:** Medium  
**Test Type:** Error Handling  
**Reference:** RS-6, Section 3.1.1

**Preconditions:**
- Test database is initialized
- No user with clerk_id "nonexistent_user" exists

**Test Steps:**
1. Send GET request to `/api/users/nonexistent_user`
2. Verify response status code
3. Verify error message

**Test Data:**
- Endpoint: `GET /api/users/nonexistent_user`

**Expected Result:**
- Response status code: 404 Not Found
- Error message indicates user not found

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests error handling for non-existent resources

---

### TC-008: Create User with Invalid Email Format

**Test Case ID:** TC-008  
**Test Case Name:** Test Creating User with Invalid Email Format  
**Module:** User Management  
**Priority:** High  
**Test Type:** Validation  
**Reference:** RS-6, Section 3.1.1

**Preconditions:**
- Test database is initialized

**Test Steps:**
1. Send POST request to `/api/users` with invalid email format
2. Verify response status code
3. Verify validation error

**Test Data:**
```json
{
  "clerk_id": "user_invalid",
  "email": "not-an-email"
}
```

**Expected Result:**
- Response status code: 422 Unprocessable Entity
- Validation error for email field

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests email format validation

---

### TC-009: User Response Model Validation

**Test Case ID:** TC-009  
**Test Case Name:** Test User Response Model Matches Expected Schema  
**Module:** User Management  
**Priority:** Medium  
**Test Type:** Validation  
**Reference:** RS-6, Section 3.1.1

**Preconditions:**
- Test database is initialized

**Test Steps:**
1. Create a user
2. Verify response contains all required fields
3. Verify field types and formats
4. Verify timestamp fields

**Test Data:**
```json
{
  "clerk_id": "user_schema",
  "email": "schema@example.com",
  "first_name": "Schema",
  "last_name": "Test"
}
```

**Expected Result:**
- Response contains: `id`, `clerk_id`, `email`, `first_name`, `last_name`, `created_at`, `updated_at`, `deleted_at`
- `created_at` and `updated_at` are not null
- `deleted_at` is null for new users

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests response schema compliance

---

### TC-010: Get All Users

**Test Case ID:** TC-010  
**Test Case Name:** Test Getting All Users  
**Module:** User Management  
**Priority:** Medium  
**Test Type:** Functional  
**Reference:** RS-6, Section 3.1.1

**Preconditions:**
- Test database is initialized
- Multiple users exist in database

**Test Steps:**
1. Create multiple users
2. Send GET request to `/api/users`
3. Verify response status code
4. Verify all users are returned
5. Verify response structure

**Test Data:**
- Create users with emails: "list1@example.com", "list2@example.com"
- Endpoint: `GET /api/users`

**Expected Result:**
- Response status code: 200 OK
- Response is an array
- All created users are present
- Each user has required fields

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests user listing functionality

---

### TC-011: Get All Users Excludes Deleted

**Test Case ID:** TC-011  
**Test Case Name:** Test That Deleted Users Are Not Returned  
**Module:** User Management  
**Priority:** High  
**Test Type:** Data Integrity  
**Reference:** RS-6, Section 3.1.1

**Preconditions:**
- Test database is initialized
- Active and deleted users exist

**Test Steps:**
1. Create active user
2. Create deleted user (with deleted_at set)
3. Send GET request to `/api/users`
4. Verify only active users are returned

**Test Data:**
- Active user: email "active@example.com"
- Deleted user: email "deleted@example.com", deleted_at set

**Expected Result:**
- Response status code: 200 OK
- Only active user is in response
- Deleted user is not in response

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests soft delete functionality

---

### TC-012: User Timestamps

**Test Case ID:** TC-012  
**Test Case Name:** Test User Timestamp Fields  
**Module:** User Management  
**Priority:** Low  
**Test Type:** Data Integrity  
**Reference:** RS-6, Section 3.1.1

**Preconditions:**
- Test database is initialized

**Test Steps:**
1. Create a user
2. Verify created_at is set
3. Verify updated_at is set
4. Verify deleted_at is null

**Test Data:**
```json
{
  "clerk_id": "user_timestamp",
  "email": "timestamp@example.com"
}
```

**Expected Result:**
- `created_at` is not null and is a valid timestamp
- `updated_at` is not null and is a valid timestamp
- `deleted_at` is null

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests timestamp field initialization

---

### TC-013: User ID Format

**Test Case ID:** TC-013  
**Test Case Name:** Test User ID is Valid UUID  
**Module:** User Management  
**Priority:** Medium  
**Test Type:** Validation  
**Reference:** RS-6, Section 3.1.1

**Preconditions:**
- Test database is initialized

**Test Steps:**
1. Create a user
2. Extract user ID from response
3. Verify ID is a valid UUID format

**Test Data:**
```json
{
  "clerk_id": "user_uuid",
  "email": "uuid@example.com"
}
```

**Expected Result:**
- User ID is present in response
- User ID is a valid UUID string
- UUID can be parsed successfully

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests UUID format validation

---

## Module 3: Project Management

### TC-014: Create Project

**Test Case ID:** TC-014  
**Test Case Name:** Test Creating a New Project  
**Module:** Project Management  
**Priority:** High  
**Test Type:** Functional  
**Reference:** RS-6, Section 3.1.2

**Preconditions:**
- Test database is initialized
- User exists (created via test setup)

**Test Steps:**
1. Create a user
2. Send POST request to `/api/projects` with project data
3. Verify response status code
4. Verify response contains project data
5. Verify project_id is valid UUID
6. Verify timestamps are present

**Test Data:**
```json
{
  "name": "Test Project"
}
```

**Expected Result:**
- Response status code: 201 Created
- Response contains: `project_id`, `name`, `owner_id`, `created_at`, `updated_at`, `deleted_at`
- `project_id` is a valid UUID
- `owner_id` matches created user
- `deleted_at` is null

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Happy path for project creation

---

### TC-015: Create Project Creates Default Swim Lanes

**Test Case ID:** TC-015  
**Test Case Name:** Test That Creating Project Creates Default Swim Lanes  
**Module:** Project Management  
**Priority:** High  
**Test Type:** Functional  
**Reference:** RS-6, Section 3.1.2

**Preconditions:**
- Test database is initialized
- User exists

**Test Steps:**
1. Create a user
2. Create a project
3. Query database for swim lanes associated with project
4. Verify default swim lanes exist
5. Verify swim lane names and order

**Test Data:**
```json
{
  "name": "Test Project"
}
```

**Expected Result:**
- Three default swim lanes created: "Backlog" (order 0), "To Do" (order 1), "Done" (order 2)
- All swim lanes have correct order values
- All swim lanes are not deleted

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests automatic swim lane creation

---

### TC-016: Get Project

**Test Case ID:** TC-016  
**Test Case Name:** Test Getting a Specific Project  
**Module:** Project Management  
**Priority:** High  
**Test Type:** Functional  
**Reference:** RS-6, Section 3.1.2

**Preconditions:**
- Test database is initialized
- User and project exist

**Test Steps:**
1. Create a user
2. Create a project
3. Send GET request to `/api/projects/{project_id}`
4. Verify response status code
5. Verify response contains correct project data

**Test Data:**
- Project name: "Test Project"
- Endpoint: `GET /api/projects/{project_id}`

**Expected Result:**
- Response status code: 200 OK
- Response contains project with matching project_id
- Project name matches

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests project retrieval

---

### TC-017: Get Project Not Found

**Test Case ID:** TC-017  
**Test Case Name:** Test Getting a Project That Doesn't Exist  
**Module:** Project Management  
**Priority:** Medium  
**Test Type:** Error Handling  
**Reference:** RS-6, Section 3.1.2

**Preconditions:**
- Test database is initialized
- User exists
- Project with specified ID does not exist

**Test Steps:**
1. Create a user
2. Generate a fake UUID
3. Send GET request to `/api/projects/{fake_id}`
4. Verify response status code

**Test Data:**
- Endpoint: `GET /api/projects/{non-existent-uuid}`

**Expected Result:**
- Response status code: 404 Not Found

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests error handling for non-existent projects

---

### TC-018: Get User Projects

**Test Case ID:** TC-018  
**Test Case Name:** Test Getting All Projects for a User  
**Module:** Project Management  
**Priority:** High  
**Test Type:** Functional  
**Reference:** RS-6, Section 3.1.2

**Preconditions:**
- Test database is initialized
- User exists
- Multiple projects exist for the user

**Test Steps:**
1. Create a user
2. Create multiple projects for the user
3. Send GET request to `/api/projects`
4. Verify response status code
5. Verify all user's projects are returned

**Test Data:**
- Projects: "Project 1", "Project 2"
- Endpoint: `GET /api/projects`

**Expected Result:**
- Response status code: 200 OK
- Response is an array
- All created projects are present
- Project names match

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests project listing for user

---

### TC-019: Get Project Unauthorized

**Test Case ID:** TC-019  
**Test Case Name:** Test That Users Can't Access Projects They Don't Own  
**Module:** Project Management  
**Priority:** High  
**Test Type:** Authorization  
**Reference:** RS-6, Section 3.1.2

**Preconditions:**
- Test database is initialized
- Two users exist
- Project owned by user2 exists

**Test Steps:**
1. Create user1 and user2
2. Create project owned by user2
3. Authenticate as user1
4. Send GET request to `/api/projects/{project_id}` for user2's project
5. Verify response status code

**Test Data:**
- User1: clerk_id "test_clerk_user_123"
- User2: clerk_id "test_clerk_user_456"
- Project owned by user2

**Expected Result:**
- Response status code: 404 Not Found (security: don't reveal existence)

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests authorization for project access

---

### TC-020: Update Project Name

**Test Case ID:** TC-020  
**Test Case Name:** Test Updating a Project's Name  
**Module:** Project Management  
**Priority:** High  
**Test Type:** Functional  
**Reference:** RS-6, Section 3.1.2

**Preconditions:**
- Test database is initialized
- User and project exist

**Test Steps:**
1. Create a user
2. Create a project with name "Original Name"
3. Send PUT request to `/api/projects/{project_id}` with new name
4. Verify response status code
5. Verify project name is updated

**Test Data:**
```json
{
  "name": "Updated Name"
}
```

**Expected Result:**
- Response status code: 200 OK
- Response contains updated project name
- Project ID remains the same

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests project name update

---

### TC-021: Update Project Roles

**Test Case ID:** TC-021  
**Test Case Name:** Test Updating a Project's Roles  
**Module:** Project Management  
**Priority:** High  
**Test Type:** Functional  
**Reference:** RS-6, Section 3.1.2

**Preconditions:**
- Test database is initialized
- User and project with roles exist

**Test Steps:**
1. Create a user
2. Create a project with roles ["admin", "editor"]
3. Send PUT request to update roles
4. Verify response status code
5. Verify roles are updated

**Test Data:**
```json
{
  "roles": ["admin", "editor", "viewer"]
}
```

**Expected Result:**
- Response status code: 200 OK
- Response contains updated roles array
- All three roles are present

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests project roles update

---

### TC-022: Update Project Name and Roles

**Test Case ID:** TC-022  
**Test Case Name:** Test Updating Both Project Name and Roles  
**Module:** Project Management  
**Priority:** Medium  
**Test Type:** Functional  
**Reference:** RS-6, Section 3.1.2

**Preconditions:**
- Test database is initialized
- User and project exist

**Test Steps:**
1. Create a user
2. Create a project
3. Send PUT request with both name and roles
4. Verify both are updated

**Test Data:**
```json
{
  "name": "New Name",
  "roles": ["admin", "viewer"]
}
```

**Expected Result:**
- Response status code: 200 OK
- Both name and roles are updated
- All changes are reflected in response

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests simultaneous updates

---

### TC-023: Update Project Unauthorized

**Test Case ID:** TC-023  
**Test Case Name:** Test That Users Can't Update Projects They Don't Own  
**Module:** Project Management  
**Priority:** High  
**Test Type:** Authorization  
**Reference:** RS-6, Section 3.1.2

**Preconditions:**
- Test database is initialized
- Two users exist
- Project owned by user2 exists

**Test Steps:**
1. Create user1 and user2
2. Create project owned by user2
3. Authenticate as user1
4. Send PUT request to update user2's project
5. Verify response status code

**Test Data:**
```json
{
  "name": "Hacked Name"
}
```

**Expected Result:**
- Response status code: 404 Not Found

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests authorization for project updates

---

### TC-024: Update Project Not Found

**Test Case ID:** TC-024  
**Test Case Name:** Test Updating a Project That Doesn't Exist  
**Module:** Project Management  
**Priority:** Medium  
**Test Type:** Error Handling  
**Reference:** RS-6, Section 3.1.2

**Preconditions:**
- Test database is initialized
- User exists
- Project with specified ID does not exist

**Test Steps:**
1. Create a user
2. Generate a fake UUID
3. Send PUT request to `/api/projects/{fake_id}`
4. Verify response status code

**Test Data:**
```json
{
  "name": "New Name"
}
```

**Expected Result:**
- Response status code: 404 Not Found

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests error handling for non-existent projects

---

### TC-025: Project Timestamps

**Test Case ID:** TC-025  
**Test Case Name:** Test Project Timestamp Fields  
**Module:** Project Management  
**Priority:** Low  
**Test Type:** Data Integrity  
**Reference:** RS-6, Section 3.1.2

**Preconditions:**
- Test database is initialized
- User exists

**Test Steps:**
1. Create a user
2. Create a project
3. Verify created_at is set
4. Verify updated_at is set
5. Verify deleted_at is null

**Test Data:**
```json
{
  "name": "Timestamp Project"
}
```

**Expected Result:**
- `created_at` is not null
- `updated_at` is not null
- `deleted_at` is null

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests timestamp field initialization

---

## Module 4: Swim Lane Management

### TC-026: Get Project Swim Lanes

**Test Case ID:** TC-026  
**Test Case Name:** Test Getting All Swim Lanes for a Project  
**Module:** Swim Lane Management  
**Priority:** High  
**Test Type:** Functional  
**Reference:** RS-6, Section 3.1.3

**Preconditions:**
- Test database is initialized
- User and project exist
- Multiple swim lanes exist for the project

**Test Steps:**
1. Create a user
2. Create a project
3. Create multiple swim lanes
4. Send GET request to `/api/swim-lanes/project/{project_id}`
5. Verify response status code
6. Verify all swim lanes are returned in order

**Test Data:**
- Swim lanes: "Lane 1" (order 0), "Lane 2" (order 1), "Lane 3" (order 2)
- Endpoint: `GET /api/swim-lanes/project/{project_id}`

**Expected Result:**
- Response status code: 200 OK
- Response is an array with 3 swim lanes
- Swim lanes are ordered by order field
- All swim lane data is present

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests swim lane retrieval and ordering

---

### TC-027: Get Project Swim Lanes Excludes Deleted

**Test Case ID:** TC-027  
**Test Case Name:** Test That Deleted Swim Lanes Are Not Returned  
**Module:** Swim Lane Management  
**Priority:** High  
**Test Type:** Data Integrity  
**Reference:** RS-6, Section 3.1.3

**Preconditions:**
- Test database is initialized
- User and project exist
- Active and deleted swim lanes exist

**Test Steps:**
1. Create a user and project
2. Create active swim lane
3. Create deleted swim lane (with deleted_at set)
4. Send GET request for swim lanes
5. Verify only active swim lane is returned

**Test Data:**
- Active lane: "Active"
- Deleted lane: "Deleted" (with deleted_at set)

**Expected Result:**
- Response status code: 200 OK
- Only active swim lane is in response
- Deleted swim lane is not in response

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests soft delete for swim lanes

---

### TC-028: Get Project Swim Lanes Unauthorized

**Test Case ID:** TC-028  
**Test Case Name:** Test That Users Can't Get Swim Lanes for Projects They Don't Own  
**Module:** Swim Lane Management  
**Priority:** High  
**Test Type:** Authorization  
**Reference:** RS-6, Section 3.1.3

**Preconditions:**
- Test database is initialized
- Two users exist
- Project owned by user2 exists

**Test Steps:**
1. Create user1 and user2
2. Create project owned by user2
3. Authenticate as user1
4. Send GET request for user2's project swim lanes
5. Verify response status code

**Test Data:**
- Endpoint: `GET /api/swim-lanes/project/{user2_project_id}`

**Expected Result:**
- Response status code: 404 Not Found

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests authorization for swim lane access

---

### TC-029: Create Swim Lane

**Test Case ID:** TC-029  
**Test Case Name:** Test Creating a New Swim Lane  
**Module:** Swim Lane Management  
**Priority:** High  
**Test Type:** Functional  
**Reference:** RS-6, Section 3.1.3

**Preconditions:**
- Test database is initialized
- User and project exist

**Test Steps:**
1. Create a user
2. Create a project
3. Send POST request to `/api/swim-lanes` with swim lane data
4. Verify response status code
5. Verify response contains swim lane data
6. Verify swim_lane_id is valid UUID

**Test Data:**
```json
{
  "project_id": "{project_id}",
  "name": "New Swim Lane",
  "order": 5
}
```

**Expected Result:**
- Response status code: 201 Created
- Response contains: `swim_lane_id`, `name`, `order`, `project_id`, `created_at`, `updated_at`, `deleted_at`
- `swim_lane_id` is a valid UUID
- `deleted_at` is null

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Happy path for swim lane creation

---

### TC-030: Create Swim Lane Unauthorized

**Test Case ID:** TC-030  
**Test Case Name:** Test That Users Can't Create Swim Lanes for Projects They Don't Own  
**Module:** Swim Lane Management  
**Priority:** High  
**Test Type:** Authorization  
**Reference:** RS-6, Section 3.1.3

**Preconditions:**
- Test database is initialized
- Two users exist
- Project owned by user2 exists

**Test Steps:**
1. Create user1 and user2
2. Create project owned by user2
3. Authenticate as user1
4. Send POST request to create swim lane for user2's project
5. Verify response status code

**Test Data:**
```json
{
  "project_id": "{user2_project_id}",
  "name": "Unauthorized Lane",
  "order": 0
}
```

**Expected Result:**
- Response status code: 404 Not Found

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests authorization for swim lane creation

---

### TC-031: Update Swim Lane

**Test Case ID:** TC-031  
**Test Case Name:** Test Updating a Swim Lane  
**Module:** Swim Lane Management  
**Priority:** High  
**Test Type:** Functional  
**Reference:** RS-6, Section 3.1.3

**Preconditions:**
- Test database is initialized
- User, project, and swim lane exist

**Test Steps:**
1. Create a user, project, and swim lane
2. Send PUT request to `/api/swim-lanes/{swim_lane_id}` with update data
3. Verify response status code
4. Verify swim lane is updated

**Test Data:**
```json
{
  "name": "Updated Name",
  "order": 10
}
```

**Expected Result:**
- Response status code: 200 OK
- Response contains updated name and order
- Swim lane ID remains the same

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests swim lane update

---

### TC-032: Update Swim Lane Partial

**Test Case ID:** TC-032  
**Test Case Name:** Test Updating Only Some Fields of a Swim Lane  
**Module:** Swim Lane Management  
**Priority:** Medium  
**Test Type:** Functional  
**Reference:** RS-6, Section 3.1.3

**Preconditions:**
- Test database is initialized
- User, project, and swim lane exist

**Test Steps:**
1. Create a user, project, and swim lane with order 5
2. Send PUT request updating only name
3. Verify name is updated
4. Verify order remains unchanged

**Test Data:**
```json
{
  "name": "New Name"
}
```

**Expected Result:**
- Response status code: 200 OK
- Name is updated
- Order remains 5 (unchanged)

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests partial updates

---

### TC-033: Update Swim Lane Not Found

**Test Case ID:** TC-033  
**Test Case Name:** Test Updating a Swim Lane That Doesn't Exist  
**Module:** Swim Lane Management  
**Priority:** Medium  
**Test Type:** Error Handling  
**Reference:** RS-6, Section 3.1.3

**Preconditions:**
- Test database is initialized
- User exists
- Swim lane with specified ID does not exist

**Test Steps:**
1. Create a user
2. Generate a fake UUID
3. Send PUT request to `/api/swim-lanes/{fake_id}`
4. Verify response status code

**Test Data:**
```json
{
  "name": "New Name"
}
```

**Expected Result:**
- Response status code: 404 Not Found

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests error handling

---

### TC-034: Delete Swim Lane

**Test Case ID:** TC-034  
**Test Case Name:** Test Soft Deleting a Swim Lane  
**Module:** Swim Lane Management  
**Priority:** High  
**Test Type:** Functional  
**Reference:** RS-6, Section 3.1.3

**Preconditions:**
- Test database is initialized
- User, project, and swim lane exist

**Test Steps:**
1. Create a user, project, and swim lane
2. Send DELETE request to `/api/swim-lanes/{swim_lane_id}`
3. Verify response status code
4. Verify swim lane is soft deleted (deleted_at is set)
5. Verify swim lane cannot be updated after deletion

**Test Data:**
- Endpoint: `DELETE /api/swim-lanes/{swim_lane_id}`

**Expected Result:**
- Response status code: 204 No Content
- Swim lane deleted_at is set (soft delete)
- Attempting to update deleted swim lane returns 404

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests soft delete functionality

---

### TC-035: Delete Swim Lane Unauthorized

**Test Case ID:** TC-035  
**Test Case Name:** Test That Users Can't Delete Swim Lanes from Projects They Don't Own  
**Module:** Swim Lane Management  
**Priority:** High  
**Test Type:** Authorization  
**Reference:** RS-6, Section 3.1.3

**Preconditions:**
- Test database is initialized
- Two users exist
- Project and swim lane owned by user2 exist

**Test Steps:**
1. Create user1 and user2
2. Create project and swim lane owned by user2
3. Authenticate as user1
4. Send DELETE request for user2's swim lane
5. Verify response status code

**Test Data:**
- Endpoint: `DELETE /api/swim-lanes/{user2_swim_lane_id}`

**Expected Result:**
- Response status code: 404 Not Found

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests authorization for swim lane deletion

---

## Module 5: Project User Roles

### TC-036: Get Project User Roles

**Test Case ID:** TC-036  
**Test Case Name:** Test Getting All User Roles for a Project  
**Module:** Project User Roles  
**Priority:** High  
**Test Type:** Functional  
**Reference:** RS-6, Section 3.1.4

**Preconditions:**
- Test database is initialized
- Two users and project exist
- Project user role exists

**Test Steps:**
1. Create user1 and user2
2. Create project with roles ["admin", "editor"]
3. Create project user role for user2
4. Send GET request to `/api/projects/{project_id}/user-roles`
5. Verify response status code
6. Verify user roles are returned with user details

**Test Data:**
- Endpoint: `GET /api/projects/{project_id}/user-roles`

**Expected Result:**
- Response status code: 200 OK
- Response is an array
- User role is present with user details
- Role and user_id are correct

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests user role retrieval

---

### TC-037: Create Project User Role

**Test Case ID:** TC-037  
**Test Case Name:** Test Creating a New Project User Role  
**Module:** Project User Roles  
**Priority:** High  
**Test Type:** Functional  
**Reference:** RS-6, Section 3.1.4

**Preconditions:**
- Test database is initialized
- Two users and project exist
- Project has roles defined

**Test Steps:**
1. Create user1 and user2
2. Create project with roles ["admin", "editor"]
3. Send POST request to create user role
4. Verify response status code
5. Verify user role is created

**Test Data:**
```json
{
  "project_id": "{project_id}",
  "user_id": "{user2_id}",
  "role": "admin"
}
```

**Expected Result:**
- Response status code: 201 Created
- Response contains: `id`, `project_id`, `user_id`, `role`
- All fields match input data

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Happy path for user role creation

---

### TC-038: Create Project User Role Invalid Role

**Test Case ID:** TC-038  
**Test Case Name:** Test Creating User Role with Invalid Role  
**Module:** Project User Roles  
**Priority:** High  
**Test Type:** Validation  
**Reference:** RS-6, Section 3.1.4

**Preconditions:**
- Test database is initialized
- Two users and project exist
- Project has roles ["admin", "editor"]

**Test Steps:**
1. Create user1 and user2
2. Create project with roles ["admin", "editor"]
3. Send POST request with invalid role
4. Verify response status code
5. Verify error message

**Test Data:**
```json
{
  "project_id": "{project_id}",
  "user_id": "{user2_id}",
  "role": "invalid_role"
}
```

**Expected Result:**
- Response status code: 400 Bad Request
- Error message indicates role is not defined in project

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests role validation

---

### TC-039: Create Project User Role Duplicate

**Test Case ID:** TC-039  
**Test Case Name:** Test Creating a Duplicate User Role  
**Module:** Project User Roles  
**Priority:** High  
**Test Type:** Validation  
**Reference:** RS-6, Section 3.1.4

**Preconditions:**
- Test database is initialized
- Two users and project exist
- User role already exists

**Test Steps:**
1. Create user1 and user2
2. Create project with roles
3. Create user role for user2
4. Attempt to create duplicate user role
5. Verify response status code

**Test Data:**
```json
{
  "project_id": "{project_id}",
  "user_id": "{user2_id}",
  "role": "admin"
}
```

**Expected Result:**
- First request: 201 Created
- Second request: 400 Bad Request
- Error message indicates user already has this role

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests duplicate role prevention

---

### TC-040: Update Project User Role

**Test Case ID:** TC-040  
**Test Case Name:** Test Updating a Project User Role  
**Module:** Project User Roles  
**Priority:** High  
**Test Type:** Functional  
**Reference:** RS-6, Section 3.1.4

**Preconditions:**
- Test database is initialized
- Two users and project exist
- User role exists

**Test Steps:**
1. Create user1 and user2
2. Create project with roles ["admin", "editor", "viewer"]
3. Create user role with "admin"
4. Send PUT request to update role to "editor"
5. Verify response status code
6. Verify role is updated

**Test Data:**
```json
{
  "role": "editor"
}
```

**Expected Result:**
- Response status code: 200 OK
- Response contains updated role "editor"
- User ID remains the same

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests user role update

---

### TC-041: Update Project User Role Invalid Role

**Test Case ID:** TC-041  
**Test Case Name:** Test Updating User Role to Invalid Role  
**Module:** Project User Roles  
**Priority:** High  
**Test Type:** Validation  
**Reference:** RS-6, Section 3.1.4

**Preconditions:**
- Test database is initialized
- Two users and project exist
- User role exists
- Project has roles ["admin", "editor"]

**Test Steps:**
1. Create user1 and user2
2. Create project with roles ["admin", "editor"]
3. Create user role
4. Send PUT request with invalid role
5. Verify response status code

**Test Data:**
```json
{
  "role": "invalid_role"
}
```

**Expected Result:**
- Response status code: 400 Bad Request
- Error message indicates role is not defined

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests role validation on update

---

### TC-042: Delete Project User Role

**Test Case ID:** TC-042  
**Test Case Name:** Test Deleting a Project User Role  
**Module:** Project User Roles  
**Priority:** High  
**Test Type:** Functional  
**Reference:** RS-6, Section 3.1.4

**Preconditions:**
- Test database is initialized
- Two users and project exist
- User role exists

**Test Steps:**
1. Create user1 and user2
2. Create project with roles
3. Create user role
4. Send DELETE request
5. Verify response status code
6. Verify user role is deleted (not in list)

**Test Data:**
- Endpoint: `DELETE /api/projects/{project_id}/user-roles/{role_id}`

**Expected Result:**
- Response status code: 204 No Content
- User role is not returned in GET request
- Soft delete is implemented

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests user role deletion

---

### TC-043: Get Project User Roles Unauthorized

**Test Case ID:** TC-043  
**Test Case Name:** Test That Users Can't Access User Roles for Projects They Don't Own  
**Module:** Project User Roles  
**Priority:** High  
**Test Type:** Authorization  
**Reference:** RS-6, Section 3.1.4

**Preconditions:**
- Test database is initialized
- Two users exist
- Project owned by user2 exists

**Test Steps:**
1. Create user1 and user2
2. Create project owned by user2
3. Authenticate as user1
4. Send GET request for user2's project user roles
5. Verify response status code

**Test Data:**
- Endpoint: `GET /api/projects/{user2_project_id}/user-roles`

**Expected Result:**
- Response status code: 404 Not Found

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests authorization for user role access

---

### TC-044: Create Project User Role Unauthorized

**Test Case ID:** TC-044  
**Test Case Name:** Test That Users Can't Create User Roles for Projects They Don't Own  
**Module:** Project User Roles  
**Priority:** High  
**Test Type:** Authorization  
**Reference:** RS-6, Section 3.1.4

**Preconditions:**
- Test database is initialized
- Two users exist
- Project owned by user2 exists

**Test Steps:**
1. Create user1 and user2
2. Create project owned by user2
3. Authenticate as user1
4. Send POST request to create user role for user2's project
5. Verify response status code

**Test Data:**
```json
{
  "project_id": "{user2_project_id}",
  "user_id": "{user1_id}",
  "role": "admin"
}
```

**Expected Result:**
- Response status code: 404 Not Found

**Actual Result:** (To be filled during execution)  
**Status:** (To be filled during execution)  
**Remarks:** Tests authorization for user role creation

---

## Test Case Summary

**Total Test Cases:** 44

### Breakdown by Module:
- **Health Check**: 1 test case (TC-001)
- **User Management**: 12 test cases (TC-002 to TC-013)
- **Project Management**: 12 test cases (TC-014 to TC-025)
- **Swim Lane Management**: 10 test cases (TC-026 to TC-035)
- **Project User Roles**: 9 test cases (TC-036 to TC-044)

### Breakdown by Test Type:
- **Functional**: 28 test cases
- **Authorization**: 8 test cases
- **Validation**: 5 test cases
- **Error Handling**: 3 test cases

### Breakdown by Priority:
- **High**: 35 test cases
- **Medium**: 8 test cases
- **Low**: 1 test case

---

**Document End**

