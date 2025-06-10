import type { User, AdaptedUser } from '../types';

export function maskEmail(email: string): string {
  const [username, domain] = email.split('@');
  const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
  return `${maskedUsername}@${domain}`;
}

export function maskPassword(password: string): string {
  return '*'.repeat(password.length);
}

export function maskName(name: string): string {
  const parts = name.split(' ');
  return parts.map(part => part.charAt(0) + '*'.repeat(part.length - 1)).join(' ');
}

export function maskUserData(user: User): User {
  return {
    ...user,
    email: maskEmail(user.email),
    name: maskName(user.name)
  };
}

export function maskAdaptedUserData(user: AdaptedUser): AdaptedUser {
  return {
    ...user,
    email: maskEmail(user.email),
    firstName: maskName(user.firstName),
    lastName: maskName(user.lastName)
  };
} 