import * as recipientProfileRepository from "../repositories/recipientProfile.repository.js";
import * as donorProfileRepository from "../repositories/donorProfile.repository.js";
import { userRole } from "../models/User.js";

export function createProfile(role, userId, profile) {
  if (role === userRole.Recipient) {
    return recipientProfileRepository.create({ userId, ...profile });
  }
  return donorProfileRepository.create({ userId, ...profile });
}
