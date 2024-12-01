import request from "supertest";
import mongoose from "mongoose";
import { app } from "../../index.js";
import { User } from "../../models/index.js";

// Configure test environment
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key";

describe("Authentication Controller", () => {
  let server;

  // Setup and teardown
  beforeAll(async () => {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ateleslie"
    );
    server = app.listen(0); // Use dynamic port
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await server.close();
  });

  // Clear database before each test
  beforeEach(async () => {
    try {
      await User.deleteMany({});
      await mongoose.connection.collection("users").drop();
    } catch (error) {
      // Ignore collection does not exist error
      if (error.code !== 26) {
        throw error;
      }
    }
  });

  // Helpers
  const createTestUser = async (
    username = "testuser",
    email = "test@example.com",
    password = "ValidPass123!"
  ) => {
    const res = await request(app).post("/api/auth/register").send({
      username,
      email,
      password,
      confirmPassword: password,
    });

    console.log("Created user:", res.body.data.user);
    return res.body.data.user;
  };

  const getAuthToken = async () => {
    const user = await createTestUser();
    const res = await request(app).post("/api/auth/login").send({
      email: user.email,
      password: "ValidPass123!",
    });

    // Extract the cookie from the response headers
    const cookies = res.headers["set-cookie"];
    if (!cookies || cookies.length === 0) {
      throw new Error("No cookies found in login response");
    }

    // Find the token cookie
    const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="));
    if (!tokenCookie) {
      throw new Error("Token cookie not found");
    }

    return tokenCookie.split(";")[0];
  };

  // Registration Tests
  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        username: "uniqueuser",
        email: "unique@example.com",
        password: "ValidPass123!",
        confirmPassword: "ValidPass123!",
      };

      const res = await request(app).post("/api/auth/register").send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toEqual({
        username: userData.username,
        email: userData.email,
      });

      // Verify user was actually created in database
      const createdUser = await User.findOne({ email: userData.email });
      expect(createdUser).toBeTruthy();
      expect(createdUser.username).toBe(userData.username);
      expect(createdUser.email).toBe(userData.email);
      expect(await createdUser.comparePassword(userData.password)).toBe(true);
    });

    it("should prevent registering with existing email", async () => {
      // First, create a user
      await createTestUser();

      // Try to register with same email
      const res = await request(app).post("/api/auth/register").send({
        username: "anotheruser",
        email: "test@example.com",
        password: "ValidPass123!",
        confirmPassword: "ValidPass123!",
      });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("should prevent registering with mismatched passwords", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "newuser",
        email: "newuser@example.com",
        password: "ValidPass123!",
        confirmPassword: "DifferentPass123!",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // Login Tests
  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await createTestUser();
    });

    it("should login user with correct credentials", async () => {
      // Create a test user with specific credentials
      const userData = {
        username: "logintest",
        email: "login@example.com",
        password: "ValidPass123!",
      };

      await createTestUser(
        userData.username,
        userData.email,
        userData.password
      );

      const res = await request(app).post("/api/auth/login").send({
        email: userData.email,
        password: userData.password,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();

      // Verify cookie is set
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/token=.+/);

      // Verify token works for protected routes
      const profileRes = await request(app)
        .get("/api/auth/profile")
        .set("Cookie", cookies);

      expect(profileRes.statusCode).toBe(200);
      expect(profileRes.body.data.user.email).toBe(userData.email);
    });

    it("should reject login with incorrect password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "WrongPassword123!",
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // Profile Tests
  describe("GET /api/auth/profile", () => {
    it("should retrieve user profile when authenticated", async () => {
      const cookie = await getAuthToken();

      const res = await request(app)
        .get("/api/auth/profile")
        .set("Cookie", cookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("test@example.com");
    });

    it("should reject profile access without token", async () => {
      const res = await request(app).get("/api/auth/profile");

      expect(res.statusCode).toBe(401);
    });
  });

  // Password Change Tests
  describe("PUT /api/auth/password/change", () => {
    it("should change password when current password is correct", async () => {
      const cookie = await getAuthToken();

      const res = await request(app)
        .put("/api/auth/password/change")
        .set("Cookie", cookie)
        .send({
          currentPassword: "ValidPass123!",
          newPassword: "NewValidPass123!",
        });

      console.log("Password Change Response:", {
        statusCode: res.statusCode,
        body: res.body,
        headers: res.headers,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Password changed successfully");
    });

    it("should reject password change with incorrect current password", async () => {
      const cookie = await getAuthToken();

      const res = await request(app)
        .put("/api/auth/password/change")
        .set("Cookie", cookie)
        .send({
          currentPassword: "WrongPassword123!",
          newPassword: "NewValidPass123!",
        });

      console.log("Incorrect Password Change Response:", {
        statusCode: res.statusCode,
        body: res.body,
        headers: res.headers,
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Current password is incorrect");
    });
  });

  // Forgot Password Tests
  describe("POST /api/auth/password/forgot", () => {
    beforeEach(async () => {
      await createTestUser();
    });

    it("should send password reset link for existing email", async () => {
      const res = await request(app)
        .post("/api/auth/password/forgot")
        .send({ email: "test@example.com" });

      console.log("Forgot Password Response:", {
        statusCode: res.statusCode,
        body: res.body,
        headers: res.headers,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Reset token sent to email");
    });

    it("should reject forgot password for non-existent email", async () => {
      const res = await request(app)
        .post("/api/auth/password/forgot")
        .send({ email: "nonexistent@example.com" });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
