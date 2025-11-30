import { userService } from "../services/userService.js";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";

class UserController {
  createUser = asyncHandler(async (req, res) => {
    const userData = req.body;
    const newUser = await userService.createUser(userData);
    res.status(StatusCodes.CREATED).json(newUser);
  });

  getAllUsers = asyncHandler(async (req, res) => {
    const users = await userService.getAllUsers();
    res.status(StatusCodes.OK).json(users);
  });

  deleteUser = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    await userService.deleteUser(userId);
    res.status(StatusCodes.NO_CONTENT).send();
  });

  updateUser = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const updatedData = req.body;
    const updatedUser = await userService.updateUser(userId, updatedData);
    res.status(StatusCodes.OK).json(updatedUser);
  });

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user, token } = await userService.login(email, password);

    if (user) {
      res.status(StatusCodes.OK).json({ user, token });
    } else {
      const error = new Error("Invalid email or password");
      error.statusCode = StatusCodes.UNAUTHORIZED;
      throw error;
    }
  });

  register = asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body);
    res
      .status(StatusCodes.CREATED)
      .json({ message: "User registered successfully", user });
  });
}

export const userController = new UserController();
