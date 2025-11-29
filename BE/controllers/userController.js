import { userService } from "../services/userService.js";
import { StatusCodes } from "http-status-codes";
import logger, { createLogMetadata } from "../logger/winston.log.js";
class UserController {
  async createUser(req, res) {
    const startTime = Date.now();

    try {
      const userData = req.body;

      logger.info(
        "Creating new user",
        createLogMetadata(
          req,
          null,
          null,
          {
            email: userData.email,
            role: userData.role,
            hasPassword: !!userData.password,
          },
          "USER_CONTROLLER"
        )
      );

      const newUser = await userService.createUser(userData);

      logger.info(
        "User created successfully",
        createLogMetadata(
          req,
          StatusCodes.CREATED,
          startTime,
          {
            userId: newUser.userId,
            email: newUser.email,
            role: newUser.role,
          },
          "USER_CONTROLLER"
        )
      );

      res.status(StatusCodes.CREATED).json(newUser);
    } catch (error) {
      logger.error(
        "Failed to create user",
        createLogMetadata(
          req,
          StatusCodes.INTERNAL_SERVER_ERROR,
          startTime,
          {
            error: error.message,
            email: req.body.email,
          },
          "USER_CONTROLLER"
        )
      );

      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal Server Error", error: error.message });
    }
  }
  async getAllUsers(req, res) {
    const startTime = Date.now();

    try {
      logger.info(
        "Fetching all users",
        createLogMetadata(req, null, null, {}, "USER_CONTROLLER")
      );

      const users = await userService.getAllUsers();

      logger.info(
        "Successfully retrieved all users",
        createLogMetadata(
          req,
          StatusCodes.OK,
          startTime,
          {
            usersCount: users.length,
          },
          "USER_CONTROLLER"
        )
      );

      res.status(StatusCodes.OK).json(users);
    } catch (error) {
      logger.error(
        "Failed to fetch all users",
        createLogMetadata(
          req,
          StatusCodes.INTERNAL_SERVER_ERROR,
          startTime,
          {
            error: error.message,
          },
          "USER_CONTROLLER"
        )
      );

      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal Server Error", error: error.message });
    }
  }
  async deleteUser(req, res) {
    const startTime = Date.now();

    try {
      const userId = req.params.id;

      logger.info(
        "Deleting user",
        createLogMetadata(
          req,
          null,
          null,
          {
            userId: userId,
          },
          "USER_CONTROLLER"
        )
      );

      await userService.deleteUser(userId);

      logger.info(
        "User deleted successfully",
        createLogMetadata(
          req,
          StatusCodes.NO_CONTENT,
          startTime,
          {
            userId: userId,
          },
          "USER_CONTROLLER"
        )
      );

      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      logger.error(
        "Failed to delete user",
        createLogMetadata(
          req,
          StatusCodes.INTERNAL_SERVER_ERROR,
          startTime,
          {
            error: error.message,
            userId: req.params.id,
          },
          "USER_CONTROLLER"
        )
      );

      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal Server Error", error: error.message });
    }
  }
  async updateUser(req, res) {
    const startTime = Date.now();

    try {
      const userId = req.params.id;
      const updatedData = req.body;

      logger.info(
        "Updating user",
        createLogMetadata(
          req,
          null,
          null,
          {
            userId: userId,
            updateFields: Object.keys(updatedData),
            hasPassword: !!updatedData.password,
          },
          "USER_CONTROLLER"
        )
      );

      const updatedUser = await userService.updateUser(userId, updatedData);

      logger.info(
        "User updated successfully",
        createLogMetadata(
          req,
          StatusCodes.OK,
          startTime,
          {
            userId: userId,
            updatedFields: Object.keys(updatedData),
          },
          "USER_CONTROLLER"
        )
      );

      res.status(StatusCodes.OK).json(updatedUser);
    } catch (error) {
      logger.error(
        "Failed to update user",
        createLogMetadata(
          req,
          StatusCodes.INTERNAL_SERVER_ERROR,
          startTime,
          {
            error: error.message,
            userId: req.params.id,
          },
          "USER_CONTROLLER"
        )
      );

      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal Server Error", error: error.message });
    }
  }

  async login(req, res, next) {
    const startTime = Date.now();

    try {
      const { email, password } = req.body;

      logger.info(
        "User login attempt",
        createLogMetadata(
          req,
          null,
          null,
          {
            email: email,
            hasPassword: !!password,
          },
          "USER_CONTROLLER"
        )
      );

      const { user, token } = await userService.login(email, password);

      if (user) {
        logger.info(
          "User login successful",
          createLogMetadata(
            req,
            StatusCodes.OK,
            startTime,
            {
              userId: user.userId,
              email: user.email,
              role: user.role,
            },
            "USER_CONTROLLER"
          )
        );

        res.status(StatusCodes.OK).json({ user, token });
      } else {
        logger.warn(
          "User login failed - invalid credentials",
          createLogMetadata(
            req,
            StatusCodes.UNAUTHORIZED,
            startTime,
            {
              email: email,
              reason: "invalid_credentials",
            },
            "USER_CONTROLLER"
          )
        );

        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "Invalid email or password" });
      }
    } catch (error) {
      logger.error(
        "User login error",
        createLogMetadata(
          req,
          StatusCodes.INTERNAL_SERVER_ERROR,
          startTime,
          {
            error: error.message,
            email: req.body.email,
          },
          "USER_CONTROLLER"
        )
      );

      next(error);
    }
  }

  async register(req, res) {
    const startTime = Date.now();

    try {
      logger.info(
        "User registration attempt",
        createLogMetadata(
          req,
          null,
          null,
          {
            email: req.body.email,
            role: req.body.role,
            hasPassword: !!req.body.password,
          },
          "USER_CONTROLLER"
        )
      );

      const user = await userService.createUser(req.body);

      logger.info(
        "User registration successful",
        createLogMetadata(
          req,
          StatusCodes.CREATED,
          startTime,
          {
            userId: user.userId,
            email: user.email,
            role: user.role,
          },
          "USER_CONTROLLER"
        )
      );

      res
        .status(StatusCodes.CREATED)
        .json({ message: "User registered successfully", user });
    } catch (error) {
      logger.error(
        "User registration failed",
        createLogMetadata(
          req,
          StatusCodes.INTERNAL_SERVER_ERROR,
          startTime,
          {
            error: error.message,
            email: req.body.email,
          },
          "USER_CONTROLLER"
        )
      );

      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error", error: error.message });
    }
  }
}

export const userController = new UserController();
