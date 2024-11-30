import User from '../models/user.model.js';
import asyncHandler from '../utils/helpers/asyncHandler.js';
import { HTTP_STATUS } from '../utils/constants/index.js';
import { ApiError } from '../utils/helpers/errorHandler.js';

export const userController = {
  // Obtenir tous les admins
  getAdmins: asyncHandler(async (req, res) => {
    const admins = await User.find({ role: 'admin' }).select('-password');
    res.status(HTTP_STATUS.OK).json(admins);
  }),

  // Mettre à jour un admin
  updateAdmin: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { username, email } = req.body;

    const admin = await User.findById(id);
    if (!admin) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Admin non trouvé');
    }

    // Mise à jour des champs
    if (username) admin.username = username;
    if (email) admin.email = email;

    await admin.save();
    res.status(HTTP_STATUS.OK).json({
      message: 'Admin mis à jour avec succès',
      admin: { ...admin.toObject(), password: undefined }
    });
  }),

  // Changer le mot de passe d'un admin
  changePassword: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const admin = await User.findById(id);
    if (!admin) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Admin non trouvé');
    }

    // Vérifier l'ancien mot de passe
    const isValid = await admin.comparePassword(currentPassword);
    if (!isValid) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Mot de passe actuel incorrect');
    }

    // Mettre à jour le mot de passe
    admin.password = newPassword;
    await admin.save();

    res.status(HTTP_STATUS.OK).json({
      message: 'Mot de passe changé avec succès'
    });
  })
};
