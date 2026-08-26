import { userRole } from "../models/User.js";
import * as recipientProfileRepository from "../repositories/recipientProfile.repository.js";
import * as donorProfileRepository from "../repositories/donorProfile.repository.js";

/** Picks the role's profile repository. Role is trusted (from the signed token
 * and re-read off the User doc), and the route already restricts to members. */
export function profileRepositoryFor(role) {
  return role === userRole.Recipient
    ? recipientProfileRepository
    : donorProfileRepository;
}