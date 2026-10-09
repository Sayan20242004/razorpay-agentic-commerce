
interface User {
  role?: string | null;
}

export function getRole(user: User): string {
  return user.role.toLowerCase();
}
