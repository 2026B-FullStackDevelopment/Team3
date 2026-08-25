import { userRole } from "../models/User.js";
import * as userRepository from "../repositories/user.repository.js";
import * as recipientProfileRepository from "../repositories/recipientProfile.repository.js";
import * as donorProfileRepository from "../repositories/donorProfile.repository.js";
import bcrypt from "bcrypt";
import { env } from "../../../config/env.js";
import { toUserDTO } from "../dtos/user.dto.js";
import { ConflictError } from "../../../shared/errors/errors.js";

const DUPLICATE_KEY = 11000;

/**
 * Registers a new Donor or Recipient: creates the User, then the matching
 * role profile. Input is assumed already validated/normalized by the
 * validator. Returns a safe user DTO
 */
export async function register({ email, password, role, profile }) {
  if (await userRepository.existsByEmail(email)) {
    throw new ConflictError("Email is already registered");
  }

  const passwordHash = await bcrypt.hash(password, env.auth.bcryptRounds);
  const user = await userRepository.create({ email, passwordHash, role });

  try {
    await createProfile(role, user._id, profile);
  } catch (error) {
    await userRepository.deleteById(user._id); // Delete user if the create user profile failed.
    if (error?.code === DUPLICATE_KEY) {
      throw new ConflictError("Profile details are already in use");
    }
    throw error;
  }

  return toUserDTO(user);
}

function createProfile(role, userId, profile) {
  if (role === userRole.Recipient) {
    return recipientProfileRepository.create({ userId, ...profile });
  }
  return donorProfileRepository.create({ userId, ...profile });
}
