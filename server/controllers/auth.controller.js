import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { config } from '../config/index.js';
import { HTTP_STATUS } from '../utils/constants/http.constants.js';
import { validatePassword } from '../utils/helpers/validation.js';

const register = async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(HTTP_STATUS.CONFLICT).json({
                success: false,
                message: 'A user with this email already exists'
            });
        }

        // Vérifier si les mots de passe correspondent
        if (password !== confirmPassword) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        // Valider le mot de passe
        if (!validatePassword(password)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character'
            });
        }

        // Hasher le mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Créer le nouvel utilisateur
        const user = new User({
            username,
            email,
            password: hashedPassword,
            role: 'user'
        });

        await user.save();

        // Générer le token JWT
        const token = jwt.sign(
            { id: user._id, role: user.role },
            config.jwtSecret,
            { expiresIn: '30d' }
        );

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Registration successful',
            data: {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error during registration'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérifier si l'utilisateur existe
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'User not found'
            });
        }

        // Vérifier le mot de passe
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Incorrect password'
            });
        }

        // Générer le token JWT
        const token = jwt.sign(
            { id: user._id, role: user.role },
            config.jwtSecret,
            { expiresIn: '30d' }
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error during login'
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error during profile retrieval:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error during profile retrieval'
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { username, email } = req.body;

        // Vérifier si l'email est déjà utilisé par un autre utilisateur
        if (email) {
            const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
            if (existingUser) {
                return res.status(HTTP_STATUS.CONFLICT).json({
                    success: false,
                    message: 'This email is already in use'
                });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { username, email } },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Error during profile update:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error during profile update'
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Récupérer l'utilisateur avec le mot de passe
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'User not found'
            });
        }

        // Vérifier le mot de passe actuel
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Valider le nouveau mot de passe
        if (!validatePassword(newPassword)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character'
            });
        }

        // Hasher et mettre à jour le nouveau mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Error during password change:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error during password change'
        });
    }
};

export const authController = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword
};
