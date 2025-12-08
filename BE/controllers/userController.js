import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UserDTO } from "../dtos/UserDTO.js";

export class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  createUser = asyncHandler(async (req, res) => {
    const userData = req.body;
    const newUser = await this.userService.createUser(userData);
    res.status(StatusCodes.CREATED).json(new UserDTO(newUser));
  });

  getAllUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const { users, currentPage, totalPages } = await this.userService.getAllUsers(page);
    res.status(StatusCodes.OK).json({
      users: users.map(u => new UserDTO(u)),
      currentPage,
      totalPages
    });
  });

  deleteUser = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    await this.userService.deleteUser(userId);
    res.status(StatusCodes.OK).json({ message: "User deleted successfully" });
  });

  updateUser = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const updatedData = req.body;
    await this.userService.updateUser(userId, updatedData);
    res.status(StatusCodes.OK).json({ message: "User updated successfully" });
  });

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user, token } = await this.userService.login(email, password);
    res.status(StatusCodes.OK).json({ user: new UserDTO(user), token });
  });
}
