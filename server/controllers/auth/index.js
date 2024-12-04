import { User } from "../../models/index.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { ApiError } from "../../utils/error.js";
import { responseHelpers } from "../../utils/response.js";
import { ROLES } from "../../config/permissions.js";
import crypto from "crypto";
import { newsletterService } from "../../services/newsletter.js";

const { sendResponse } = responseHelpers;

export const register = async (req, res, next) => {
  try {
    const {
      username,
      email,
      password,
      role,
      interests,
      newsletterSubscribed,
      phoneNumber,
    } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        "Email or username already exists"
      );
    }

    // Définir le rôle par défaut si non spécifié
    const userRole = role || ROLES.USER;

    // Vérifier si le rôle est autorisé
    if (!Object.values(ROLES).includes(userRole)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid role");
    }

    const user = await User.create({
      username,
      email,
      password,
      role: userRole,
      interests: interests || [],
      newsletterSubscribed: newsletterSubscribed || false,
      phoneNumber,
      isActive: true,
    });

    // Mettre à jour les permissions basées sur le rôle
    user.updatePermissionsBasedOnRole();
    await user.save();

    // Gérer l'abonnement à la newsletter si activé
    if (newsletterSubscribed) {
      await newsletterService.subscribe({
        email,
        firstName: username,
        interests: interests || [],
      });
    }

    const token = user.generateAuthToken();

    sendResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: "User registered successfully",
      data: {
        token,
        user: {
          username: user.username,
          email: user.email,
          role: user.role,
          interests: user.interests,
          newsletterSubscribed: user.newsletterSubscribed,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid email or password");
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, "Account is not active");
    }

    // Mettre à jour la date de dernière connexion
    user.lastLogin = new Date();
    await user.save();

    const token = user.generateAuthToken();

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    sendResponse(res, {
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  // Supprimer le cookie
  res.clearCookie("token");

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    message: "Logout successful",
  });
};

export const profile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    sendResponse(res, {
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          interests: user.interests,
          newsletterSubscribed: user.newsletterSubscribed,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const updates = {
      username: req.body.username,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      interests: req.body.interests,
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    sendResponse(res, {
      message: "Profile updated successfully",
      data: {
        user: {
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber,
          interests: user.interests,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "No user found with this email"
      );
    }

    const resetToken = user.createPasswordResetToken();
    await user.save();

    // TODO: Implémenter l'envoi d'email de réinitialisation
    // await emailService.sendPasswordResetEmail(user.email, resetToken);

    sendResponse(res, {
      message: "Password reset token generated",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmNewPassword } = req.body;

    // Vérifier que les mots de passe correspondent
    if (newPassword !== confirmNewPassword) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Passwords do not match");
    }

    // Hacher le token pour la comparaison
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Trouver un utilisateur avec ce token de réinitialisation valide
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Token is invalid or has expired"
      );
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    sendResponse(res, {
      message: "Password reset successfully",
      data: {
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    // Validate required fields
    if (!currentPassword) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Current password is required');
    }

    if (!newPassword) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'New password is required');
    }

    // Récupérer l'utilisateur connecté
    const user = await User.findById(req.user.id);

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    // Vérifier le mot de passe actuel
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Current password is incorrect"
      );
    }

    // Vérifier que les nouveaux mots de passe correspondent
    if (newPassword !== confirmNewPassword) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "New passwords do not match");
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    sendResponse(res, {
      message: "Password changed successfully",
      data: {
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};
